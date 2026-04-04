import { motion } from "framer-motion";
import { Instagram, Music2, Eye, TrendingUp } from "lucide-react";
import { formatNumber, type Stats } from "@/lib/data";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getStatsFromSupabase } from "@/lib/supabase-data";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}

const StatCard = ({ icon, label, value, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-card rounded-2xl p-4 sm:p-5 md:p-6 shadow-elegant border border-primary/10 hover:border-primary/30 transition-all hover:scale-105"
  >
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>
    </div>
    <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary">{value}</p>
  </motion.div>
);

const LiveStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured()) {
        const s = await getStatsFromSupabase();
        if (s) setStats(s);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't render if no stats available
  if (!stats) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-center text-primary mb-6 sm:mb-8 md:mb-12"
        >
          Estadísticas en Vivo
        </motion.h2>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <StatCard
            icon={<Instagram className="w-5 h-5" />}
            label="Instagram"
            value={formatNumber(stats.instagram_followers)}
            delay={0.1}
          />
          <StatCard
            icon={<Music2 className="w-5 h-5" />}
            label="TikTok"
            value={formatNumber(stats.tiktok_followers)}
            delay={0.2}
          />
          <StatCard
            icon={<Eye className="w-5 h-5" />}
            label="Total Views"
            value={formatNumber(stats.total_views)}
            delay={0.3}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Engagement"
            value={`${stats.engagement_rate}%`}
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
