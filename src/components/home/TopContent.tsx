import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook, ChevronUp, ChevronDown } from "lucide-react";
import { type BestPost } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getBestPostsFromSupabase } from "@/lib/supabase-data";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import PostPreview from "./PostPreview";
// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const TopContent = () => {
  const [posts, setPosts] = useState<BestPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Separate posts by platform
  const instagramPosts = posts.filter(p => p.platform === 'instagram');
  const tiktokPosts = posts.filter(p => p.platform === 'tiktok');
  const facebookPosts = posts.filter(p => p.platform === 'facebook');

  useEffect(() => {
    const loadPosts = async () => {
      if (isSupabaseConfigured()) {
        const supabasePosts = await getBestPostsFromSupabase();
        if (supabasePosts && supabasePosts.length > 0) {
          setPosts(supabasePosts);
        }
      }
      setLoading(false);
    };

    loadPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-pulse text-primary">Cargando contenido...</div>
        </div>
      </section>
    );
  }

  // No mostrar si no hay posts
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-center text-primary mb-8 md:mb-12"
        >
          Top Content
        </motion.h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* Instagram Column */}
          <PlatformColumn 
            posts={instagramPosts} 
            platform="instagram" 
            icon={<Instagram className="w-4 h-4 md:w-5 md:h-5" />}
            title="Instagram"
          />
          
          {/* TikTok Column */}
          <PlatformColumn 
            posts={tiktokPosts} 
            platform="tiktok" 
            icon={<TikTokIcon className="w-4 h-4 md:w-5 md:h-5" />}
            title="TikTok"
          />
          
          {/* Facebook Column */}
          <PlatformColumn 
            posts={facebookPosts} 
            platform="facebook" 
            icon={<Facebook className="w-4 h-4 md:w-5 md:h-5" />}
            title="Facebook"
          />
        </div>
      </div>
    </section>
  );
};

interface PlatformColumnProps {
  posts: BestPost[];
  platform: string;
  icon: React.ReactNode;
  title: string;
}

const PlatformColumn = ({ posts, platform, icon, title }: PlatformColumnProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    axis: "y",
    loop: posts.length > 1,
    align: "start",
    dragFree: true,
    containScroll: false,
    skipSnaps: false,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card/50 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center min-h-[250px] sm:min-h-[280px] md:min-h-[300px] border border-dashed border-primary/20"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
          {icon}
        </div>
        <h3 className="font-bold text-primary mb-1 text-sm md:text-base">{title}</h3>
        <p className="text-xs text-muted-foreground text-center">
          No hay posts de {title} aún
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card/30 rounded-xl p-3 md:p-4 border border-primary/10"
    >
      {/* Platform Header */}
      <div className="flex items-center gap-2 mb-3 md:mb-4 pb-2 md:pb-3 border-b border-primary/10">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="font-bold text-primary text-sm md:text-base">{title}</h3>
        <span className="ml-auto text-[10px] md:text-xs text-muted-foreground bg-primary/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
          {posts.length} posts
        </span>
      </div>

      {/* Vertical Carousel with Snap */}
      <div className="relative">
        {posts.length > 2 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-7 h-7 md:w-8 md:h-8 bg-card/80 hover:bg-card shadow-sm disabled:opacity-0"
          >
            <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        )}

        <div 
          className="overflow-hidden h-[280px] sm:h-[320px] md:h-[380px] touch-pan-y" 
          ref={emblaRef}
        >
          <div className="flex flex-col gap-2 md:gap-3">
            {posts.map((post) => (
              <div key={post.id} className="flex-[0_0_auto] min-h-0">
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </div>

        {posts.length > 2 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 w-7 h-7 md:w-8 md:h-8 bg-card/80 hover:bg-card shadow-sm disabled:opacity-0"
          >
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const PostCard = ({ post }: { post: BestPost }) => (
  <PostPreview post={post} />
);

export default TopContent;
