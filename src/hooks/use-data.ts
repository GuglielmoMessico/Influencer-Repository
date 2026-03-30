import { useState, useEffect, useCallback } from 'react';
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
  isSupabaseConfigured
} from '@/lib/supabase-data';

// Hook for stats - SOLO Supabase
export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    
    if (isSupabaseConfigured()) {
      const supabaseStats = await getStatsFromSupabase();
      if (supabaseStats) {
        setStats(supabaseStats);
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateStats = async (newStats: Partial<Stats>) => {
    const updated = await updateStatsInSupabase(newStats);
    if (updated) {
      setStats(updated);
      return updated;
    }
    return null;
  };

  return { stats, loading, updateStats, refresh: fetchStats, useSupabase: isSupabaseConfigured() };
};

// Hook for campaigns - SOLO Supabase
export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    
    if (isSupabaseConfigured()) {
      const supabaseCampaigns = await getCampaignsFromSupabase();
      if (supabaseCampaigns) {
        setCampaigns(supabaseCampaigns);
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const addCampaign = async (campaign: Omit<Campaign, 'id'>) => {
    const added = await addCampaignToSupabase(campaign);
    if (added) {
      setCampaigns(prev => [added, ...prev]);
      return added;
    }
    return null;
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const updated = await updateCampaignInSupabase(id, updates);
    if (updated) {
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    }
    return null;
  };

  const removeCampaign = async (id: string) => {
    const success = await deleteCampaignFromSupabase(id);
    if (success) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      return true;
    }
    return false;
  };

  return { campaigns, loading, addCampaign, updateCampaign, removeCampaign, refresh: fetchCampaigns, useSupabase: isSupabaseConfigured() };
};

// Hook for best posts - SOLO Supabase
export const useBestPosts = () => {
  const [posts, setPosts] = useState<BestPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    if (isSupabaseConfigured()) {
      const supabasePosts = await getBestPostsFromSupabase();
      if (supabasePosts) {
        setPosts(supabasePosts);
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPost = async (post: Omit<BestPost, 'id'>) => {
    const added = await addBestPostToSupabase(post);
    if (added) {
      setPosts(prev => [added, ...prev]);
      return added;
    }
    return null;
  };

  const removePost = async (id: string) => {
    const success = await deleteBestPostFromSupabase(id);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== id));
      return true;
    }
    return false;
  };

  return { posts, loading, addPost, removePost, refresh: fetchPosts, useSupabase: isSupabaseConfigured() };
};

// Function to get campaign by code and email - SOLO Supabase
export const getCampaignByCodeAndEmail = async (code: string, email: string): Promise<Campaign | null> => {
  if (isSupabaseConfigured()) {
    return await getCampaignByCodeAndEmailFromSupabase(code, email);
  }
  return null;
};

// Hook for audience demographics - SOLO Supabase (sin datos hardcodeados)
export const useAudienceData = () => {
  const [genderData, setGenderData] = useState<AudienceGender[]>([]);
  const [ageData, setAgeData] = useState<AudienceAge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAudienceData = useCallback(async () => {
    setLoading(true);
    
    if (isSupabaseConfigured()) {
      const [gender, age] = await Promise.all([
        getAudienceGenderFromSupabase(),
        getAudienceAgeFromSupabase()
      ]);
      
      // Solo setear si hay datos reales - NO usar fallbacks
      setGenderData(gender || []);
      setAgeData(age || []);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAudienceData();
  }, [fetchAudienceData]);

  const updateGenderData = async (newData: AudienceGender[]) => {
    const success = await updateAudienceGenderInSupabase(newData);
    if (success) {
      setGenderData(newData);
      return true;
    }
    return false;
  };

  const updateAgeData = async (newData: AudienceAge[]) => {
    const success = await updateAudienceAgeInSupabase(newData);
    if (success) {
      setAgeData(newData);
      return true;
    }
    return false;
  };

  return { 
    genderData, 
    ageData, 
    loading, 
    updateGenderData, 
    updateAgeData, 
    refresh: fetchAudienceData,
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for campaign insights - SOLO Supabase
export const useCampaignInsights = (campaignId?: string) => {
  const [insights, setInsights] = useState<CampaignInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = useCallback(async (id: string) => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      const data = await getCampaignInsightsFromSupabase(id);
      setInsights(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) {
      fetchInsights(campaignId);
    }
  }, [campaignId, fetchInsights]);

  const upsertInsights = async (data: Omit<CampaignInsight, 'id' | 'updated_at'>) => {
    const updated = await upsertCampaignInsightsInSupabase(data);
    if (updated) {
      setInsights(updated);
      return updated;
    }
    return null;
  };

  return { 
    insights, 
    loading, 
    upsertInsights, 
    refresh: () => campaignId && fetchInsights(campaignId),
    useSupabase: isSupabaseConfigured() 
  };
};

// Hook for hero videos - SOLO Supabase
export const useHeroVideos = () => {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    
    if (isSupabaseConfigured()) {
      const supabaseVideos = await getHeroVideosFromSupabase();
      if (supabaseVideos) {
        setVideos(supabaseVideos);
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const addVideo = async (video: Omit<HeroVideo, 'id' | 'created_at'>) => {
    const added = await addHeroVideoToSupabase(video);
    if (added) {
      setVideos(prev => [...prev, (added as HeroVideo)].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      return true;
    }
    return false;
  };

  const updateVideo = async (id: string, updates: Partial<HeroVideo>) => {
    const updated = await updateHeroVideoInSupabase(id, updates);
    if (updated) {
      setVideos(prev => 
        prev.map(v => v.id === id ? updated : v)
            .sort((a, b) => a.order_index - b.order_index)
      );
      return updated;
    }
    return null;
  };

  const removeVideo = async (id: string) => {
    const success = await deleteHeroVideoFromSupabase(id);
    if (success) {
      setVideos(prev => prev.filter(v => v.id !== id));
      return true;
    }
    return false;
  };

  const toggleVideoActive = async (id: string, active: boolean) => {
    const updated = await updateVideo(id, { is_active: active });
    return !!updated;
  };

  return { 
    videos, 
    loading, 
    addVideo, 
    updateVideo, 
    removeVideo, 
    toggleVideoActive,
    refresh: fetchVideos, 
    useSupabase: isSupabaseConfigured() 
  };
};
