import { motion } from "framer-motion";
import { Instagram, Music2, Eye, TrendingUp, Facebook } from "lucide-react";
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

// SVG icon for X (formerly Twitter)
const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// SVG icon for Threads
const ThreadsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 192 192" fill="currentColor" aria-hidden="true">
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.141-23.887 1.37-39.224 15.264-38.34 34.568.449 9.791 5.277 18.215 13.594 23.745 7.001 4.716 16.025 7.033 25.404 6.52 12.378-.673 22.097-5.405 28.907-14.06 5.179-6.674 8.453-15.305 9.896-26.145 5.93 3.578 10.315 8.298 12.786 13.966 4.492 10.42 4.765 27.517-9.133 41.346-12.121 12.059-26.702 17.286-48.74 17.442-24.39-.172-42.908-8.006-55.04-23.287C9.676 141.658 3.899 122.413 3.663 96c.236-26.413 6.013-45.658 17.179-57.205 12.132-15.281 30.65-23.115 55.04-23.287 24.561.174 43.525 8.036 56.383 23.365 6.34 7.559 11.082 17.06 14.158 28.152l16.49-4.405c-3.779-13.964-9.936-26.006-18.406-35.88C127.974 9.568 105.204-.057 76.086 0l-.256.002C46.78.057 24.46 9.71 11.009 27.512-1.012 43.162-7.007 65.496-7 96c-.007 30.504 5.988 52.838 18.009 68.488 13.451 17.802 35.771 27.455 65.021 27.51l.256.002c26.338-.047 44.852-7.066 60.155-22.31 20.307-20.219 19.706-45.377 12.995-60.839-4.798-11.128-14.045-20.181-27.899-26.863z" />
  </svg>
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
      <div className="container mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-center text-primary mb-6 sm:mb-8 md:mb-12"
        >
          Estadísticas en Vivo
        </motion.h2>
        
        {/* Grid: 2 cols mobile → 3 cols tablet → 4 cols desktop, 7 cards balanced */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
            icon={<Facebook className="w-5 h-5" />}
            label="Facebook"
            value={formatNumber(stats.facebook_followers ?? 0)}
            delay={0.3}
          />
          <StatCard
            icon={<XIcon />}
            label="X"
            value={formatNumber(stats.x_followers ?? 0)}
            delay={0.4}
          />
          <StatCard
            icon={<ThreadsIcon />}
            label="Threads"
            value={formatNumber(stats.threads_followers ?? 0)}
            delay={0.5}
          />
          <StatCard
            icon={<Eye className="w-5 h-5" />}
            label="Total Views"
            value={formatNumber(stats.total_views)}
            delay={0.6}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Engagement"
            value={`${stats.engagement_rate}%`}
            delay={0.7}
          />
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
