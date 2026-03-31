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
  isSupabaseConfigured,
  logAuditAction
} from '@/lib/supabase-data';

// Hook for stats - Optimized with React Query
export const useStats = () => {
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        return await getStatsFromSupabase();
      }
      return null;
    },
  });

  const updateStatsMutation = useMutation({
    mutationFn: updateStatsInSupabase,
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(['stats'], updated);
        logAuditAction({
          action: 'update_stats',
          resource_type: 'stats',
          new_values: updated
        });
      }
    }
  });

  return { 
    stats: stats || null, 
    loading, 
    updateStats: updateStatsMutation.mutateAsync, 
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for campaigns - Optimized with React Query
export const useCampaigns = () => {
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading: loading, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        const data = await getCampaignsFromSupabase();
        return data || [];
      }
      return [];
    },
  });

  const addCampaignMutation = useMutation({
    mutationFn: addCampaignToSupabase,
    onSuccess: (added) => {
      if (added) {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        logAuditAction({
          action: 'create_campaign',
          resource_type: 'campaign',
          resource_id: added.id,
          new_values: added
        });
      }
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) => 
      updateCampaignInSupabase(id, updates),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        logAuditAction({
          action: 'update_campaign',
          resource_type: 'campaign',
          resource_id: updated.id,
          new_values: updated
        });
      }
    }
  });

  const removeCampaignMutation = useMutation({
    mutationFn: deleteCampaignFromSupabase,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      logAuditAction({
        action: 'delete_campaign',
        resource_type: 'campaign',
        resource_id: id
      });
    }
  });

  return { 
    campaigns: campaigns || [], 
    loading, 
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

  const { data: posts, isLoading: loading, refetch } = useQuery({
    queryKey: ['best_posts'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        const data = await getBestPostsFromSupabase();
        return data || [];
      }
      return [];
    },
  });

  const addPostMutation = useMutation({
    mutationFn: addBestPostToSupabase,
    onSuccess: (added) => {
      if (added) {
        queryClient.invalidateQueries({ queryKey: ['best_posts'] });
        logAuditAction({
          action: 'create_best_post',
          resource_type: 'best_post',
          resource_id: added.id,
          new_values: added
        });
      }
    }
  });

  const removePostMutation = useMutation({
    mutationFn: deleteBestPostFromSupabase,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['best_posts'] });
      logAuditAction({
        action: 'delete_best_post',
        resource_type: 'best_post',
        resource_id: id
      });
    }
  });

  return { 
    posts: posts || [], 
    loading, 
    addPost: addPostMutation.mutateAsync, 
    removePost: removePostMutation.mutateAsync, 
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};

// Function to get campaign by code and email
export const getCampaignByCodeAndEmail = async (code: string, email: string): Promise<Campaign | null> => {
  if (isSupabaseConfigured()) {
    return await getCampaignByCodeAndEmailFromSupabase(code, email);
  }
  return null;
};

// Hook for audience demographics - Optimized with React Query
export const useAudienceData = () => {
  const queryClient = useQueryClient();

  const { data: audience, isLoading: loading, refetch } = useQuery({
    queryKey: ['audience_data'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        const [gender, age] = await Promise.all([
          getAudienceGenderFromSupabase(),
          getAudienceAgeFromSupabase()
        ]);
        return { gender: gender || [], age: age || [] };
      }
      return { gender: [], age: [] };
    },
  });

  const updateGenderMutation = useMutation({
    mutationFn: updateAudienceGenderInSupabase,
    onSuccess: (success, newData) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['audience_data'] });
        logAuditAction({
          action: 'update_audience_gender',
          resource_type: 'audience',
          new_values: newData
        });
      }
    }
  });

  const updateAgeMutation = useMutation({
    mutationFn: updateAudienceAgeInSupabase,
    onSuccess: (success, newData) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['audience_data'] });
        logAuditAction({
          action: 'update_audience_age',
          resource_type: 'audience',
          new_values: newData
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

  const { data: videos, isLoading: loading, refetch } = useQuery({
    queryKey: ['hero_videos'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        const data = await getHeroVideosFromSupabase();
        return (data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
      return [];
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: addHeroVideoToSupabase,
    onSuccess: (added) => {
      if (added) {
        queryClient.invalidateQueries({ queryKey: ['hero_videos'] });
        logAuditAction({
          action: 'add_hero_video',
          resource_type: 'hero_video',
          resource_id: added.id,
          new_values: added
        });
      }
    }
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HeroVideo> }) => 
      updateHeroVideoInSupabase(id, updates),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['hero_videos'] });
        logAuditAction({
          action: 'update_hero_video',
          resource_type: 'hero_video',
          resource_id: updated.id,
          new_values: updated
        });
      }
    }
  });

  const removeVideoMutation = useMutation({
    mutationFn: deleteHeroVideoFromSupabase,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hero_videos'] });
      logAuditAction({
        action: 'delete_hero_video',
        resource_type: 'hero_video',
        resource_id: id
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
        queryClient.invalidateQueries({ queryKey: ['hero_videos'] });
        return true;
      }
      return false;
    },
    refresh: refetch, 
    useSupabase: isSupabaseConfigured() 
  };
};
