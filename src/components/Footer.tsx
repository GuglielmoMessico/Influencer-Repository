import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Instagram, Music2, Facebook } from "lucide-react";
import type { ProfileConfig } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getProfileFromSupabase } from "@/lib/supabase-data";

const Footer = () => {
  const [profile, setProfile] = useState<ProfileConfig | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (isSupabaseConfigured()) {
        const supabaseProfile = await getProfileFromSupabase();
        if (supabaseProfile) {
          setProfile(supabaseProfile);
        }
      }
    };
    loadProfile();
  }, []);

  return (
    <footer className="bg-primary text-primary-foreground py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {profile?.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt="Logo"
                className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Logo className={`h-12 sm:h-14 md:h-16 lg:h-20 w-auto text-primary-foreground ${profile?.logoUrl ? 'hidden' : ''}`} />
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center">
            {profile?.socialLinks?.instagram && (
              <a 
                href={profile.socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-sm md:text-base"
              >
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            )}
            {profile?.socialLinks?.tiktok && (
              <a 
                href={profile.socialLinks.tiktok} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-sm md:text-base"
              >
                <Music2 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">TikTok</span>
              </a>
            )}
            {profile?.socialLinks?.facebook && (
              <a 
                href={profile.socialLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-sm md:text-base"
              >
                <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Facebook</span>
              </a>
            )}
          </div>
          
          {/* Copyright */}
          <p className="text-xs sm:text-sm opacity-60 text-center">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
