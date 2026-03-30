import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import type { ProfileConfig } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getProfileFromSupabase } from "@/lib/supabase-data";

const Navbar = () => {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/10">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center flex-shrink-0">
          {profile?.logoUrl ? (
            <img 
              src={profile.logoUrl} 
              alt="Logo"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain"
              onError={(e) => {
                // Fallback to SVG logo if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Logo className={`h-10 sm:h-12 md:h-14 lg:h-16 w-auto text-primary ${profile?.logoUrl ? 'hidden' : ''}`} />
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/campana">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-auto"
            >
              Soy Marca
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 w-8 h-8 sm:w-10 sm:h-10">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
