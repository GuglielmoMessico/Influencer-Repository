import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, User, Mail, FileText, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import yeferProfile from "@/assets/yefer-profile.jpeg";
import type { ProfileConfig } from "@/lib/data";
import { useRef, useState, useEffect } from "react";
import Logo from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getProfileFromSupabase } from "@/lib/supabase-data";
import { useHeroVideos } from "@/hooks/use-data";
import HeroVideoBanner from "./HeroVideoBanner";

const Hero = () => {
  const [profile, setProfile] = useState<ProfileConfig | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { videos, loading: videosLoading } = useHeroVideos();
  const navigate = useNavigate();
  
  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured()) {
        const p = await getProfileFromSupabase();
        if (p) setProfile(p);
      }
      setProfileLoading(false);
    };
    load();
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  // Parallax transforms - image moves slower, content moves faster
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const videoY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  
  // Use custom image URL if provided, otherwise use default
  const profileImage = profile?.profileImageUrl || yeferProfile;

  // Real data from Supabase
  const valueBio = profile?.bio || "";
  const tagline = profile?.tagline || "";
  const tags = profile?.tags || [];
  const logoUrl = profile?.logoUrl;

  return (
    <section ref={sectionRef} className="relative min-h-screen pt-32 pb-20 px-4 flex items-center overflow-hidden">
      {/* Dynamic Background Video Banner */}
      <motion.div style={{ y: videoY }} className="absolute inset-0 z-0">
        <HeroVideoBanner videos={videos} maxVideos={3} />
      </motion.div>

      {!videos.filter(v => v.is_active).length && !videosLoading && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      )}

      <div className="container mx-auto relative z-20">
        <div className="flex flex-col items-center gap-10">
          {/* Profile Image + Logo with Parallax */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ y: imageY, scale: imageScale }}
            className="relative flex flex-col items-center gap-8"
          >
            {/* Profile Photo */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-primary/50 shadow-2xl bg-background">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = yeferProfile;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              {tagline && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -bottom-2 -right-2 sm:bottom-4 sm:right-0 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-black flex items-center gap-2 shadow-xl border-2 border-white/10"
                >
                  <Sparkles className="w-4 h-4 text-secondary-foreground animate-pulse" />
                  {tagline}
                </motion.div>
              )}
            </div>

            {/* Logo below photo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-48 sm:w-64 md:w-80 filter drop-shadow-2xl"
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo"
                  className="w-full h-auto object-contain max-h-24"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Logo className={`w-full h-auto text-primary px-4 ${logoUrl ? 'hidden' : ''}`} />
            </motion.div>
          </motion.div>

          {/* Content with Parallax */}
          <motion.div 
            style={{ y: contentY }}
            className="text-center max-w-3xl mx-auto"
          >
            {tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3 mb-8"
              >
                {tags.map((tag) => (
                  <span key={tag} className="px-5 py-2 bg-primary/20 backdrop-blur-md text-primary rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border border-primary/20">
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}

            {valueBio && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl sm:text-2xl text-foreground/90 mb-12 font-medium leading-relaxed drop-shadow-sm"
              >
                {valueBio}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/campana" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group gradient-primary text-primary-foreground font-black px-10 py-8 text-xl shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto rounded-2xl"
                >
                  Ver Resultados
                  <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-2" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-primary/50 backdrop-blur-sm text-primary font-black px-10 py-8 text-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 w-full sm:w-auto rounded-2xl shadow-xl"
                  >
                    <Mail className="mr-3 w-6 h-6" />
                    Colaborar
                    <ChevronDown className="ml-3 w-5 h-5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 bg-background/95 backdrop-blur-xl border-primary/20 p-2 shadow-2xl rounded-xl">
                  <DropdownMenuItem 
                    className="rounded-lg p-4 cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                    onClick={() => window.location.href = 'mailto:contacto@yefershow.com'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold">Enviar Email</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="rounded-lg p-4 cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                    onClick={() => navigate('/cotizacion')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold">Formulario VIP</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      
    </section>
  );
};

export default Hero;
