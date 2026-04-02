import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCreatorBySlug } from '@/lib/supabase-data';
import type { Creator } from '@/lib/data';

interface CreatorContextType {
  creatorId: string | null;
  creatorData: Creator | null;
  loading: boolean;
  error: string | null;
  slug: string | null;
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

export const CreatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug: urlSlug } = useParams<{ slug?: string }>();
  const [creatorData, setCreatorData] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determinar el slug efectivo (neutral por defecto)
  const effectiveSlug = urlSlug || null;

  useEffect(() => {
    const fetchCreator = async () => {
      if (!effectiveSlug) {
        setCreatorData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const data = await getCreatorBySlug(effectiveSlug);
        if (data) {
          setCreatorData(data);
        } else {
          setError(`Creador "${effectiveSlug}" no encontrado`);
        }
      } catch (err) {
        console.error("Error fetching creator:", err);
        setError("Error al cargar la configuración del creador");
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [effectiveSlug]);

  const value = {
    creatorId: creatorData?.id || null,
    creatorData,
    loading,
    error,
    slug: effectiveSlug
  };

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
};

export const useCreator = () => {
  const context = useContext(CreatorContext);
  if (context === undefined) {
    throw new Error('useCreator must be used within a CreatorProvider');
  }
  return context;
};
