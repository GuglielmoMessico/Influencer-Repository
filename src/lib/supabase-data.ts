// Supabase data operations - used when Supabase is configured
import { getSupabaseClient, isSupabaseConfigured } from './supabase-client';
import type { Stats, Campaign, BestPost, ProfileConfig, Testimonial, WorkFormat, BrandClick, CampaignInsight, HeroVideo } from './data';

// Quote Request type
export interface QuoteRequest {
  id?: string;
  brand_name: string;
  brand_email: string;
  brand_whatsapp?: string;
  brand_info?: string;
  brand_website_url: string;
  platform: string;
  platforms?: string[];
  campaign_type: string;
  campaign_types?: string[];
  script_mode?: 'free' | 'established';
  brief_file_url?: string;
  brief_file_type?: string;
  brief_html?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  budget_currency?: string;
  expected_reach?: number;
  expected_impressions?: number;
  expected_clicks?: number;
  expected_ctr?: number;
  expected_engagement?: number;
  notes?: string;
  status?: string;
  created_at?: string;
}

// Stats operations
export const getStatsFromSupabase = async (): Promise<Stats | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('stats')
    .select('*')
    .maybeSingle();

  if (error || !data) return null;

  return {
    instagram_followers: data.instagram_followers,
    tiktok_followers: data.tiktok_followers,
    total_views: data.total_views,
    engagement_rate: data.engagement_rate,
    last_updated: data.last_updated,
  };
};

export const updateStatsInSupabase = async (stats: Partial<Stats>): Promise<Stats | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const updateData = {
    ...stats,
    last_updated: new Date().toISOString(),
  };

  // Try to update existing row, or insert if none exists
  const { data: existing } = await client.from('stats').select('id').limit(1);
  
  if (existing && existing.length > 0) {
    const { data, error } = await client
      .from('stats')
      .update(updateData)
      .eq('id', existing[0].id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as Stats;
  } else {
    const { data, error } = await client
      .from('stats')
      .insert(updateData)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as Stats;
  }
};

// Campaigns operations
export const getCampaignsFromSupabase = async (): Promise<Campaign[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return null;
  return data as Campaign[];
};

export const getCampaignByCodeAndEmailFromSupabase = async (
  code: string, 
  email: string
): Promise<Campaign | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaigns')
    .select('*, campaign_insights(*)')
    .ilike('campaign_code', code)
    .ilike('brand_email', email)
    .maybeSingle();

  if (error || !data) return null;
  
  // Map the joined insights to the insights property
  const campaign = data as any;
  if (campaign.campaign_insights && campaign.campaign_insights.length > 0) {
    campaign.insights = campaign.campaign_insights[0];
  } else if (campaign.campaign_insights && !Array.isArray(campaign.campaign_insights)) {
    campaign.insights = campaign.campaign_insights;
  }
  
  return campaign as Campaign;
};

export const addCampaignToSupabase = async (
  campaign: Omit<Campaign, 'id'>
): Promise<Campaign | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaigns')
    .insert(campaign)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as Campaign;
};

export const updateCampaignInSupabase = async (
  id: string,
  updates: Partial<Campaign>
): Promise<Campaign | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as Campaign;
};

export const deleteCampaignFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('campaigns')
    .delete()
    .eq('id', id);

  return !error;
};

// Best Posts operations
export const getBestPostsFromSupabase = async (): Promise<BestPost[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('best_posts')
    .select('*')
    .order('views_count', { ascending: false });

  if (error) return null;
  return data as BestPost[];
};

export const addBestPostToSupabase = async (
  post: Omit<BestPost, 'id'>
): Promise<BestPost | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('best_posts')
    .insert(post)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as BestPost;
};

export const deleteBestPostFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('best_posts')
    .delete()
    .eq('id', id);

  return !error;
};

// Profile operations
export const getProfileFromSupabase = async (): Promise<ProfileConfig | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('profile')
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return {
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    bio: data.bio,
    profileImageUrl: data.profile_image_url || '',
    logoUrl: data.logo_url || '',
    tags: data.tags || [],
    socialLinks: data.social_links || { instagram: '', tiktok: '', email: '', x: '', threads: '' },
  };
};

export const saveProfileToSupabase = async (profile: ProfileConfig): Promise<ProfileConfig | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const profileData = {
    name: profile.name,
    tagline: profile.tagline,
    description: profile.description,
    bio: profile.bio,
    profile_image_url: profile.profileImageUrl,
    logo_url: profile.logoUrl,
    tags: profile.tags,
    social_links: profile.socialLinks,
  };

  // Try to update existing row, or insert if none exists
  const { data: existing } = await client.from('profile').select('id').limit(1);
  
  if (existing && existing.length > 0) {
    const { data, error } = await client
      .from('profile')
      .update(profileData)
      .eq('id', existing[0].id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return profile;
  } else {
    const { data, error } = await client
      .from('profile')
      .insert(profileData)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return profile;
  }
};

// Testimonials operations
export const getTestimonialsFromSupabase = async (): Promise<Testimonial[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return null;
  return data as Testimonial[];
};

export const addTestimonialToSupabase = async (
  testimonial: Omit<Testimonial, 'id'>
): Promise<Testimonial | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('testimonials')
    .insert(testimonial)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as Testimonial;
};

export const updateTestimonialInSupabase = async (
  id: string, 
  updates: Partial<Testimonial>
): Promise<Testimonial | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('testimonials')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as Testimonial;
};

export const deleteTestimonialFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('testimonials')
    .delete()
    .eq('id', id);

  return !error;
};

// Work Formats operations
export const getWorkFormatsFromSupabase = async (): Promise<WorkFormat[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('work_formats')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) return null;
  return data as WorkFormat[];
};

export const addWorkFormatToSupabase = async (
  format: Omit<WorkFormat, 'id'>
): Promise<WorkFormat | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('work_formats')
    .insert(format)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as WorkFormat;
};

export const updateWorkFormatInSupabase = async (
  id: string,
  updates: Partial<WorkFormat>
): Promise<WorkFormat | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('work_formats')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as WorkFormat;
};

export const deleteWorkFormatFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('work_formats')
    .delete()
    .eq('id', id);

  return !error;
};

// ============================================
// Brand Clicks Tracking Operations
// ============================================

// Track a brand click from the media kit
export const trackBrandClick = async (
  campaignId: string,
  pageSource: string = 'homepage'
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('brand_clicks')
    .insert({
      campaign_id: campaignId,
      page_source: pageSource,
    });

  return !error;
};

// Get all clicks for a specific campaign
export const getBrandClicksForCampaign = async (campaignId: string): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) return 0;

  const { count, error } = await client
    .from('brand_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  if (error) return 0;
  return count || 0;
};

// Get all brand clicks with campaign details (for admin dashboard)
export const getAllBrandClicksWithDetails = async (): Promise<{ campaignId: string; brandName: string; clicks: number }[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  // FIXED: Aggregated fetch to avoid N+1 queries
  // 1. Get all campaigns
  const { data: campaigns, error: campaignsError } = await client
    .from('campaigns')
    .select('id, brand_name');

  if (campaignsError || !campaigns || campaigns.length === 0) return [];

  // 2. Get ALL clicks in ONE query instead of looping
  const { data: allClicks, error: clicksError } = await client
    .from('brand_clicks')
    .select('campaign_id');

  if (clicksError || !allClicks) return [];

  // 3. Aggregate in JS (O(n) instead of O(n*m) queries)
  const clickMap: Record<string, number> = {};
  allClicks.forEach(click => {
    clickMap[click.campaign_id] = (clickMap[click.campaign_id] || 0) + 1;
  });

  const results = campaigns.map((campaign) => ({
    campaignId: campaign.id,
    brandName: campaign.brand_name,
    clicks: clickMap[campaign.id] || 0,
  }));

  return results.filter(r => r.clicks > 0).sort((a, b) => b.clicks - a.clicks);
};

// Log audit action for security and traceability
export const logAuditAction = async (params: {
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
}) => {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // This will fail silently if the table audit_logs doesn't exist yet
    // which is fine as the user needs to apply the SQL migration
    const { data: { user } } = await client.auth.getUser();
    
    await client.from('audit_logs').insert({
      user_id: user?.id,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      old_values: params.old_values,
      new_values: params.new_values,
    });
  } catch (error) {
    console.warn('Audit log failed (likely table missing):', error);
  }
};

// Get total brand clicks across all campaigns
export const getTotalBrandClicks = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) return 0;

  const { count, error } = await client
    .from('brand_clicks')
    .select('*', { count: 'exact', head: true });

  if (error) return 0;
  return count || 0;
};

// ============================================
// Quote Requests Operations
// ============================================

// Submit a new quote request (public - no auth required)
export const submitQuoteRequest = async (
  data: Omit<QuoteRequest, 'id' | 'created_at' | 'status'>
): Promise<QuoteRequest | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: result, error } = await client
    .from('quote_requests')
    .insert({
      brand_name: data.brand_name,
      brand_email: data.brand_email,
      brand_whatsapp: data.brand_whatsapp || null,
      brand_info: data.brand_info || null,
      brand_website_url: data.brand_website_url,
      platform: data.platform || (data.platforms && data.platforms.length > 0 ? data.platforms[0] : 'mixto'),
      platforms: data.platforms || [data.platform],
      campaign_type: data.campaign_type || (data.campaign_types && data.campaign_types.length > 0 ? data.campaign_types[0] : 'mixto'),
      campaign_types: data.campaign_types || [data.campaign_type],
      script_mode: data.script_mode || 'free',
      brief_file_url: data.brief_file_url || null,
      brief_file_type: data.brief_file_type || null,
      brief_html: data.brief_html || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget || null,
      budget_currency: data.budget_currency || 'MXN',
      expected_reach: data.expected_reach || null,
      expected_impressions: data.expected_impressions || null,
      expected_clicks: data.expected_clicks || null,
      expected_ctr: data.expected_ctr || null,
      expected_engagement: data.expected_engagement || null,
      notes: data.notes || null,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error submitting quote request:', error.message, error.code, error.details);
    return null;
  }
  return result as QuoteRequest;
};

// Get all quote requests (admin only)
export const getQuoteRequestsFromSupabase = async (): Promise<QuoteRequest[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('quote_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return null;
  return data as QuoteRequest[];
};

// Update quote request status (admin only)
export const updateQuoteRequestStatus = async (
  id: string,
  status: 'pending' | 'reviewed' | 'contacted' | 'accepted' | 'rejected'
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('quote_requests')
    .update({ status })
    .eq('id', id);

  return !error;
};

// Delete quote request (admin only)
export const deleteQuoteRequestFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('quote_requests')
    .delete()
    .eq('id', id);

  return !error;
};

/**
 * CAMPAIGN CONVERSION LOGIC
 */

// Check if a campaign already exists for a given quote request ID
export const getCampaignBySourceQuoteId = async (quoteRequestId: string): Promise<Campaign | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaigns')
    .select('*')
    .eq('source_quote_request_id', quoteRequestId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Campaign;
};

// Convert an accepted quote request to a new campaign
export const convertQuoteToCampaign = async (quote: QuoteRequest): Promise<{ success: boolean; campaign?: Campaign; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase no configurado' };

  if (!quote.id) return { success: false, error: 'ID de cotización no válido' };
  
  // 1. Verify status
  if (quote.status !== 'accepted') {
    return { success: false, error: 'Solo se pueden convertir cotizaciones aceptadas' };
  }

  // 2. Check for duplicates
  const existing = await getCampaignBySourceQuoteId(quote.id);
  if (existing) {
    return { success: false, error: 'Esta cotización ya ha sido convertida a una campaña' };
  }

  // 3. Generate campaign code
  // Usar los primeros 4 caracteres de la marca, remover espacios
  const brandPart = quote.brand_name.slice(0, 4).toUpperCase().replace(/\s/g, '');
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const campaignCode = `${brandPart}${year}${random}`;

  // 4. Data Normalization
  // Platform: if multiple or both -> 'both', else use the first one
  let platformValue: 'instagram' | 'tiktok' | 'both' = 'instagram';
  const platforms = quote.platforms || (quote.platform ? [quote.platform] : []);
  if (platforms.includes('instagram') && platforms.includes('tiktok')) {
    platformValue = 'both';
  } else if (platforms.includes('tiktok')) {
    platformValue = 'tiktok';
  }

  // Content Type: if multiple -> 'mixed', else use the first one
  let campaignTypeValue: 'stories' | 'reels' | 'post' | 'live' | 'mixed' = 'reels';
  const types = quote.campaign_types || (quote.campaign_type ? [quote.campaign_type] : []);
  if (types.length > 1) {
    campaignTypeValue = 'mixed';
  } else if (types.length === 1) {
    const t = types[0].toLowerCase();
    if (['stories', 'reels', 'post', 'live', 'mixed'].includes(t)) {
      campaignTypeValue = t as any;
    }
  }

  // 5. Create Campaign object
  const newCampaign: Omit<Campaign, 'id' | 'created_at'> = {
    campaign_code: campaignCode,
    brand_name: quote.brand_name,
    brand_email: quote.brand_email,
    brand_website_url: quote.brand_website_url,
    metrics_reach: 0,
    metrics_impressions: 0,
    metrics_clicks: 0,
    expected_reach: quote.expected_reach || 0,
    expected_impressions: quote.expected_impressions || 0,
    expected_clicks: quote.expected_clicks || 0,
    expected_ctr: quote.expected_ctr || 0,
    expected_engagement: quote.expected_engagement || 0,
    start_date: quote.start_date || "",
    end_date: quote.end_date || "",
    platform: platformValue,
    platforms: platforms,
    campaign_type: campaignTypeValue,
    campaign_types: types,
    budget: quote.budget || 0,
    budget_currency: quote.budget_currency || 'MXN',
    video_result_url: "",
    notes: quote.notes || "",
    is_active: true,
    accepted_at: new Date().toISOString(),
    source_quote_request_id: quote.id
  };

  // 6. Insert into database
  const { data, error } = await client
    .from('campaigns')
    .insert(newCampaign)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al convertir cotización:', error);
    return { success: false, error: 'Error en la base de datos al crear la campaña' };
  }

  return { success: true, campaign: data as Campaign };
};

// ============================================
// Audience Demographics Operations
// ============================================

export interface AudienceGender {
  id?: string;
  name: string;
  value: number;
}

export interface AudienceAge {
  id?: string;
  age: string;
  percentage: number;
  order_index: number;
}

export interface AudienceData {
  gender: AudienceGender[];
  age: AudienceAge[];
  summary_text?: string; // e.g., "58% entre 25-38 años"
}

// Get audience gender data
export const getAudienceGenderFromSupabase = async (): Promise<AudienceGender[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('audience_gender')
    .select('*')
    .order('name', { ascending: true });

  if (error) return null;
  return data as AudienceGender[];
};

// Get audience age data
export const getAudienceAgeFromSupabase = async (): Promise<AudienceAge[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('audience_age')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) return null;
  return data as AudienceAge[];
};

// Update audience gender data
export const updateAudienceGenderInSupabase = async (
  genderData: AudienceGender[]
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  // Delete all existing and insert new
  await client.from('audience_gender').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error } = await client
    .from('audience_gender')
    .insert(genderData.map(g => ({ name: g.name, value: g.value })));

  return !error;
};

// Update audience age data
export const updateAudienceAgeInSupabase = async (
  ageData: AudienceAge[]
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  // Delete all existing and insert new
  await client.from('audience_age').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error } = await client
    .from('audience_age')
    .insert(ageData.map((a, idx) => ({ 
      age: a.age, 
      percentage: a.percentage,
      order_index: idx 
    })));

  return !error;
};

// ============================================
// Campaign Insights Operations
// ============================================

export const getCampaignInsightsFromSupabase = async (campaignId: string): Promise<CampaignInsight | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaign_insights')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CampaignInsight;
};

export const upsertCampaignInsightsInSupabase = async (
  insights: Omit<CampaignInsight, 'id' | 'updated_at'>
): Promise<CampaignInsight | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('campaign_insights')
    .upsert(insights, { onConflict: 'campaign_id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error upserting campaign insights:', error);
    return null;
  }
  return data as CampaignInsight;
};

// ============================================
// Hero Videos Operations
// ============================================

export const getHeroVideosFromSupabase = async (): Promise<HeroVideo[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('hero_videos')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) return null;
  return data as HeroVideo[];
};

export const updateHeroVideoInSupabase = async (
  id: string,
  updates: Partial<HeroVideo>
): Promise<HeroVideo | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('hero_videos')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as HeroVideo;
};

export const addHeroVideoToSupabase = async (
  video: Omit<HeroVideo, 'id' | 'created_at'>
): Promise<HeroVideo | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('hero_videos')
    .insert(video)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return data as HeroVideo;
};

export const deleteHeroVideoFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('hero_videos')
    .delete()
    .eq('id', id);

  return !error;
};

// Hybrid data fetching - tries Supabase first, falls back to localStorage
export { isSupabaseConfigured };
