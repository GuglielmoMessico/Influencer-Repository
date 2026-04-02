import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Stats, Campaign, BestPost, AudienceGender, AudienceAge, CampaignInsight, HeroVideo } from '@/lib/data';
import {
  getStatsFromSupabase,
  updateStatsInSupabase,
  getCampaignsFromSupabase,
  addCampaignToSupabase,
  updateCampaignInSupabase,
  deleteCampaignFromSupabase,
  getBestPostsFromSupabase,
  addBestPostToSupabase,
  deleteBestPostFromSupabase,
  getCampaignByCodeAndEmailFromSupabase,
  getAudienceGenderFromSupabase,
  getAudienceAgeFromSupabase,
  updateAudienceGenderInSupabase,
  updateAudienceAgeInSupabase,
  getCampaignInsightsFromSupabase,
  upsertCampaignInsightsInSupabase,
  getHeroVideosFromSupabase,
  addHeroVideoToSupabase,
  updateHeroVideoInSupabase,
  deleteHeroVideoFromSupabase,
  getPlatformIntegrationsFromSupabase,
  upsertPlatformIntegrationInSupabase,
  isSupabaseConfigured,
  logAuditAction
} from '@/lib/supabase-data';
import { useCreator } from '@/context/CreatorContext';

// Hook for stats - Optimized with React Query
export const useStats = () => {
  const queryClient = useQueryClient();
  const { creatorId } = useCreator();
  
  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['stats', creatorId],
    queryFn: async () => {
      if (isSupabaseConfigured() && creatorId) {
        return await getStatsFromSupabase(creatorId);
      }
      return null;
    },
    enabled: !!creatorId,
  });

  const updateStatsMutation = useMutation({
    mutationFn: (updates: Partial<Stats>) => {
      if (!creatorId) throw new Error("No creator selected");
      return updateStatsInSupabase(creatorId, updates);
    },
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(['stats', creatorId], updated);
        logAuditAction({
          action: 'update_stats',
          resource_type: 'stats',
          new_values: updated,
          creator_id: creatorId
        });
      }
    }
  });

  return { 
    stats: stats || null, 
    loading: loading && !!creatorId, 
    updateStats: updateStatsMutation.mutateAsync, 
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for campaigns - Optimized with React Query
export const useCampaigns = () => {
  const queryClient = useQueryClient();
  const { creatorId } = useCreator();

  const { data: campaigns, isLoading: loading, refetch } = useQuery({
    queryKey: ['campaigns', creatorId],
    queryFn: async () => {
      if (isSupabaseConfigured() && creatorId) {
        const data = await getCampaignsFromSupabase(creatorId);
        return data || [];
      }
      return [];
    },
    enabled: !!creatorId,
  });

  const addCampaignMutation = useMutation({
    mutationFn: (campaign: Omit<Campaign, 'id' | 'created_at'>) => {
      if (!creatorId) throw new Error("No creator selected");
      return addCampaignToSupabase(creatorId, campaign);
    },
    onSuccess: (added) => {
      if (added) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', creatorId] });
        logAuditAction({
          action: 'create_campaign',
          resource_type: 'campaign',
          resource_id: added.id,
          new_values: added,
          creator_id: creatorId
        });
      }
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) => 
      updateCampaignInSupabase(id, updates),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', creatorId] });
        logAuditAction({
          action: 'update_campaign',
          resource_type: 'campaign',
          resource_id: updated.id,
          new_values: updated,
          creator_id: creatorId
        });
      }
    }
  });

  const removeCampaignMutation = useMutation({
    mutationFn: deleteCampaignFromSupabase,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', creatorId] });
      logAuditAction({
        action: 'delete_campaign',
        resource_type: 'campaign',
        resource_id: id,
        creator_id: creatorId
      });
    }
  });

  return { 
    campaigns: campaigns || [], 
    loading: loading && !!creatorId, 
    addCampaign: addCampaignMutation.mutateAsync, 
    updateCampaign: (id: string, updates: Partial<Campaign>) => updateCampaignMutation.mutateAsync({ id, updates }), 
    removeCampaign: removeCampaignMutation.mutateAsync, 
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for best posts - Optimized with React Query
export const useBestPosts = () => {
  const queryClient = useQueryClient();
  const { creatorId } = useCreator();

  const { data: posts, isLoading: loading, refetch } = useQuery({
    queryKey: ['best_posts', creatorId],
    queryFn: async () => {
      if (isSupabaseConfigured() && creatorId) {
        const data = await getBestPostsFromSupabase(creatorId);
        return data || [];
      }
      return [];
    },
    enabled: !!creatorId,
  });

  const addPostMutation = useMutation({
    mutationFn: (post: Omit<BestPost, 'id' | 'created_at'>) => {
      if (!creatorId) throw new Error("No creator selected");
      return addBestPostToSupabase(creatorId, post);
    },
    onSuccess: (added) => {
      if (added) {
        queryClient.invalidateQueries({ queryKey: ['best_posts', creatorId] });
        logAuditAction({
          action: 'create_best_post',
          resource_type: 'best_post',
          resource_id: added.id,
          new_values: added,
          creator_id: creatorId
        });
      }
    }
  });

  const removePostMutation = useMutation({
    mutationFn: deleteBestPostFromSupabase,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['best_posts', creatorId] });
      logAuditAction({
        action: 'delete_best_post',
        resource_type: 'best_post',
        resource_id: id,
        creator_id: creatorId
      });
    }
  });

  return { 
    posts: posts || [], 
    loading: loading && !!creatorId, 
    addPost: addPostMutation.mutateAsync, 
    removePost: removePostMutation.mutateAsync, 
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};

// Function to get campaign by code and email
export const getCampaignByCodeAndEmail = async (code: string, email: string, creatorId: string): Promise<Campaign | null> => {
  if (isSupabaseConfigured() && creatorId) {
    return await getCampaignByCodeAndEmailFromSupabase(code, email, creatorId);
  }
  return null;
};

// Hook for audience demographics - Optimized with React Query
export const useAudienceData = () => {
  const queryClient = useQueryClient();
  const { creatorId } = useCreator();

  const { data: audience, isLoading: loading, refetch } = useQuery({
    queryKey: ['audience_data', creatorId],
    queryFn: async () => {
      if (isSupabaseConfigured() && creatorId) {
        const [gender, age] = await Promise.all([
          getAudienceGenderFromSupabase(creatorId),
          getAudienceAgeFromSupabase(creatorId)
        ]);
        return { gender: gender || [], age: age || [] };
      }
      return { gender: [], age: [] };
    },
    enabled: !!creatorId,
  });

  const updateGenderMutation = useMutation({
    mutationFn: (genderData: AudienceGender[]) => {
      if (!creatorId) throw new Error("No creator selected");
      return updateAudienceGenderInSupabase(creatorId, genderData);
    },
    onSuccess: (success, newData) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['audience_data', creatorId] });
        logAuditAction({
          action: 'update_audience_gender',
          resource_type: 'audience',
          new_values: newData,
          creator_id: creatorId
        });
      }
    }
  });

  const updateAgeMutation = useMutation({
    mutationFn: (ageData: AudienceAge[]) => {
      if (!creatorId) throw new Error("No creator selected");
      return updateAudienceAgeInSupabase(creatorId, ageData);
    },
    onSuccess: (success, newData) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['audience_data', creatorId] });
        logAuditAction({
          action: 'update_audience_age',
          resource_type: 'audience',
          new_values: newData,
          creator_id: creatorId
        });
      }
    }
  });

  return { 
    genderData: audience?.gender || [], 
    ageData: audience?.age || [], 
    loading, 
    updateGenderData: updateGenderMutation.mutateAsync, 
    updateAgeData: updateAgeMutation.mutateAsync, 
    refresh: refetch,
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for campaign insights - Optimized with React Query
export const useCampaignInsights = (campaignId?: string) => {
  const queryClient = useQueryClient();

  const { data: insights, isLoading: loading, refetch } = useQuery({
    queryKey: ['campaign_insights', campaignId],
    queryFn: async () => {
      if (isSupabaseConfigured() && campaignId) {
        return await getCampaignInsightsFromSupabase(campaignId);
      }
      return null;
    },
    enabled: !!campaignId,
  });

  const upsertInsightsMutation = useMutation({
    mutationFn: upsertCampaignInsightsInSupabase,
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['campaign_insights', campaignId] });
        logAuditAction({
          action: 'update_insights',
          resource_type: 'campaign_insight',
          resource_id: campaignId,
          new_values: updated
        });
      }
    }
  });

  return { 
    insights: insights || null, 
    loading, 
    upsertInsights: upsertInsightsMutation.mutateAsync, 
    refresh: () => campaignId && refetch(),
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for hero videos - Optimized with React Query
export const useHeroVideos = () => {
  const queryClient = useQueryClient();
  const { creatorId } = useCreator();

  const { data: videos, isLoading: loading, refetch } = useQuery({
    queryKey: ['hero_videos', creatorId],
    queryFn: async () => {
      if (isSupabaseConfigured() && creatorId) {
        const data = await getHeroVideosFromSupabase(creatorId);
        return (data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
      return [];
    },
    enabled: !!creatorId,
  });

  const addVideoMutation = useMutation({
    mutationFn: (video: Omit<HeroVideo, 'id' | 'created_at'>) => {
      if (!creatorId) throw new Error("No creator selected");
      return addHeroVideoToSupabase(creatorId, video);
    },
    onSuccess: (added) => {
      if (added) {
        queryClient.invalidateQueries({ queryKey: ['hero_videos', creatorId] });
        logAuditAction({
          action: 'add_hero_video',
          resource_type: 'hero_video',
          resource_id: added.id,
          new_values: added,
          creator_id: creatorId
        });
      }
    }
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HeroVideo> }) => 
      updateHeroVideoInSupabase(id, updates),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['hero_videos', creatorId] });
        logAuditAction({
          action: 'update_hero_video',
          resource_type: 'hero_video',
          resource_id: updated.id,
          new_values: updated,
          creator_id: creatorId
        });
      }
    }
  });

  const removeVideoMutation = useMutation({
    mutationFn: deleteHeroVideoFromSupabase,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hero_videos', creatorId] });
      logAuditAction({
        action: 'delete_hero_video',
        resource_type: 'hero_video',
        resource_id: id,
        creator_id: creatorId
      });
    }
  });

  return { 
    videos: videos || [], 
    loading, 
    addVideo: addVideoMutation.mutateAsync, 
    updateVideo: (id: string, updates: Partial<HeroVideo>) => updateVideoMutation.mutateAsync({ id, updates }), 
    removeVideo: removeVideoMutation.mutateAsync, 
    toggleVideoActive: async (id: string, active: boolean) => {
      const result = await updateHeroVideoInSupabase(id, { is_active: active });
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['hero_videos', creatorId] });
        return true;
      }
      return false;
    },
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};

/**
 * --- LÓGICA HÍBRIDA (FASE 14) ---
 * Resuelve las métricas de una campaña basándose en su fuente y overrides.
 * Prioridad:
 * 1. Override Manual (si existe y modo es hybrid/api)
 * 2. Datos API (si modo es api/hybrid)
 * 3. Fallback Manual (datos originales)
 */
export const resolveCampaignMetrics = (campaign: Campaign) => {
  const source = campaign.metrics_source || 'manual';
  
  // REACH
  let resolvedReach = campaign.metrics_reach || 0;
  if (source === 'api' || source === 'hybrid') {
    resolvedReach = campaign.override_reach ?? campaign.real_reach_api ?? resolvedReach;
  }
  
  // IMPRESSIONS
  let resolvedImpressions = campaign.metrics_impressions || 0;
  if (source === 'api' || source === 'hybrid') {
    resolvedImpressions = campaign.override_impressions ?? campaign.real_impressions_api ?? resolvedImpressions;
  }

  return {
    reach: resolvedReach,
    impressions: resolvedImpressions,
    // Clicks y Engagement siguen lógica similar si se extienden
    engagement: campaign.real_engagement_api || 0,
    isApi: source === 'api' || source === 'hybrid',
    lastSync: campaign.last_synced_at,
    syncStatus: campaign.api_sync_status
  };
};

// Hook for platform integrations (Tokens) - Optimized with React Query
export const usePlatformIntegrations = () => {
  const queryClient = useQueryClient();
  const { creatorId } = useCreator();

  const { data: integrations, isLoading: loading, refetch } = useQuery({
    queryKey: ['platform_integrations', creatorId],
    queryFn: async () => {
      if (isSupabaseConfigured() && creatorId) {
        return await getPlatformIntegrationsFromSupabase(creatorId);
      }
      return [];
    },
    enabled: !!creatorId,
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ platform, token, expires_at }: { platform: string; token: string; expires_at?: string }) => {
      if (!creatorId) throw new Error("No creator selected");
      return await upsertPlatformIntegrationInSupabase(creatorId, platform, token, expires_at);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_integrations', creatorId] });
      logAuditAction({
        action: 'save_platform_integration',
        resource_type: 'api_integration',
        creator_id: creatorId
      });
    }
  });

  return {
    integrations: integrations || [],
    loading: loading && !!creatorId,
    saveToken: (platform: string, token: string, expires_at?: string) => 
      updateIntegrationMutation.mutateAsync({ platform, token, expires_at }),
    refresh: refetch,
    useSupabase: isSupabaseConfigured()
  };
};

export const useAllCreators = () => {
  return useQuery({
    queryKey: ['all_creators'],
    queryFn: async () => {
      const { getCreators } = await import('@/lib/supabase-data');
      return await getCreators();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
