import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Extract Media ID from Instagram URL if provided
const extractMediaId = (input: string) => {
  if (!input) return '';
  if (!input.includes('instagram.com')) return input;
  // Match shortcodes /reels/C7X-XXXX/ or /p/C7X-XXXX/ or /reel/C7X-XXXX/
  const match = input.match(/\/(?:reels|p|reel)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input;
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { campaignId } = await req.json();
    if (!campaignId) throw new Error("campaignId is required");

    // 1. Get Instagram Token from api_integrations table
    const { data: config, error: configError } = await supabase
      .from('api_integrations')
      .select('access_token')
      .eq('platform', 'instagram')
      .single();

    if (configError || !config) {
      throw new Error("Instagram integration not configured in Admin > API");
    }

    const token = config.access_token;

    // 2. Get Campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, external_post_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    let mediaId = extractMediaId(campaign.external_post_id || '');
    if (!mediaId) {
      throw new Error("No Instagram Post ID or URL configured for this campaign");
    }

    // 3. Request Insights from Facebook Graph API
    // Permissions needed: instagram_basic, instagram_manage_insights
    const fields = 'reach,impressions,engagement,saved';
    const apiUrl = `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${fields}&access_token=${token}`;

    const response = await fetch(apiUrl);
    const result = await response.json();

    // 4. Handle API Errors
    if (result.error) {
      console.error("IG API Error:", result.error);
      
      const errorMessage = `${result.error.type}: ${result.error.message}`;
      
      await supabase.from('campaigns').update({
        api_sync_status: 'error',
        api_sync_error: errorMessage
      }).eq('id', campaignId);
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        code: result.error.code
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Success - Parse results
    // Example response structure: { "data": [ { "name": "reach", "values": [{ "value": 123 }] }, ... ] }
    const metricsMap = result.data.reduce((acc: any, item: any) => {
      acc[item.name] = item.values[0].value;
      return acc;
    }, {});

    // Metrics for reports: Reach, Impressions, Engagement (comments+likes) + Saves
    const apiReach = metricsMap.reach || 0;
    const apiImpressions = metricsMap.impressions || 0;
    const apiEngagement = (metricsMap.engagement || 0) + (metricsMap.saved || 0);

    // 6. Update Database
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        real_reach_api: apiReach,
        real_impressions_api: apiImpressions,
        real_engagement_api: apiEngagement,
        api_sync_status: 'success',
        api_sync_error: null,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      success: true, 
      metrics: {
        reach: apiReach,
        impressions: apiImpressions,
        engagement: apiEngagement
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Critical Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
