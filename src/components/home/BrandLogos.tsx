import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Campaign } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getCampaignsFromSupabase, trackBrandClick } from "@/lib/supabase-data";

interface Brand {
  id: string;
  name: string;
  logo?: string;
  websiteUrl?: string;
}

const BrandLogos = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isPausedActive, setIsPausedActive] = useState(false);
  const [isPausedPast, setIsPausedPast] = useState(false);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (isSupabaseConfigured()) {
        const supabaseCampaigns = await getCampaignsFromSupabase();
        if (supabaseCampaigns) {
          setCampaigns(supabaseCampaigns);
        }
      }
    };

    loadCampaigns();
  }, []);

  // Separate active and past collaborations
  const activeBrands: Brand[] = campaigns
    .filter(c => c.is_active !== false) // Default to active if not specified
    .map(c => ({
      id: c.id,
      name: c.brand_name,
      logo: c.brand_logo_url,
      websiteUrl: c.brand_website_url,
    }));

  const pastBrands: Brand[] = campaigns
    .filter(c => c.is_active === false)
    .map(c => ({
      id: c.id,
      name: c.brand_name,
      logo: c.brand_logo_url,
      websiteUrl: c.brand_website_url,
    }));

  if (activeBrands.length === 0 && pastBrands.length === 0) {
    return null;
  }

  // Duplicate items for seamless infinite scroll
  const duplicatedActiveBrands = [...activeBrands, ...activeBrands, ...activeBrands];
  const duplicatedPastBrands = [...pastBrands, ...pastBrands, ...pastBrands];

  return (
    <section className="py-10 sm:py-12 md:py-16 px-5 overflow-hidden">
      <div className="w-full space-y-10 sm:space-y-12 md:space-y-16">
        {/* Active Collaborations */}
        {activeBrands.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-primary mb-2 sm:mb-3">
                Marcas con las que trabajo
              </h2>
              <p className="text-foreground/60 text-sm sm:text-base">
                Colaboraciones activas con marcas líderes
              </p>
            </motion.div>

            <div 
              className="relative flex justify-center"
              onMouseEnter={() => setIsPausedActive(true)}
              onMouseLeave={() => setIsPausedActive(false)}
            >
              {/* Gradient overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

              <div className="overflow-hidden max-w-full">
                <motion.div
                  className="flex gap-8 sm:gap-10 md:gap-12 items-center py-6"
                  animate={{
                    x: isPausedActive ? undefined : [0, -33.33 * activeBrands.length * 15],
                  }}
                  transition={{
                    x: {
                      duration: activeBrands.length * 10,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  style={{ width: "fit-content" }}
                >
                  {duplicatedActiveBrands.map((brand, index) => (
                    <BrandCard key={`active-${brand.id}-${index}`} brand={brand} />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Past Collaborations */}
        {pastBrands.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-primary/70 mb-2 sm:mb-3">
                Colaboraciones anteriores
              </h2>
              <p className="text-foreground/50 text-sm sm:text-base">
                Marcas con las que hemos trabajado
              </p>
            </motion.div>

            <div 
              className="relative flex justify-center"
              onMouseEnter={() => setIsPausedPast(true)}
              onMouseLeave={() => setIsPausedPast(false)}
            >
              {/* Gradient overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

              <div className="overflow-hidden max-w-full">
                <motion.div
                  className="flex gap-8 sm:gap-10 md:gap-12 items-center py-6"
                  animate={{
                    x: isPausedPast ? undefined : [0, -33.33 * pastBrands.length * 15],
                  }}
                  transition={{
                    x: {
                      duration: pastBrands.length * 10,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  style={{ width: "fit-content" }}
                >
                  {duplicatedPastBrands.map((brand, index) => (
                    <BrandCard 
                      key={`past-${brand.id}-${index}`} 
                      brand={brand} 
                      isPast 
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

interface BrandCardProps {
  brand: Brand;
  isPast?: boolean;
}

const BrandCard = ({ brand, isPast = false }: BrandCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = async () => {
    // Track the click
    if (brand.id) {
      await trackBrandClick(brand.id, 'homepage');
    }
  };

  const CardContent = () => (
    <motion.div 
      className={`flex-shrink-0 group cursor-pointer relative`}
      whileHover={{ 
        scale: 1.08, 
        y: -8,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {brand.logo ? (
        <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center p-4 sm:p-5 transition-all duration-300 border-2 ${
          isPast 
            ? 'bg-muted/40 border-primary/10 group-hover:bg-muted/60 group-hover:border-primary/30 shadow-sm group-hover:shadow-lg' 
            : 'bg-card/80 border-primary/20 group-hover:bg-card group-hover:border-primary/40 shadow-md group-hover:shadow-xl group-hover:shadow-primary/20'
        }`}>
          <img
            src={brand.logo}
            alt={brand.name}
            className={`w-full h-full object-contain rounded-full transition-all duration-300 ${
              isPast 
                ? 'filter grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80' 
                : 'opacity-80 group-hover:opacity-100'
            }`}
          />
        </div>
      ) : (
        <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center p-3 transition-all duration-300 border-2 ${
          isPast 
            ? 'bg-muted/40 border-primary/10 group-hover:bg-muted/60 group-hover:border-primary/30 shadow-sm group-hover:shadow-lg' 
            : 'bg-card/80 border-primary/20 group-hover:bg-card group-hover:border-primary/40 shadow-md group-hover:shadow-xl group-hover:shadow-primary/20'
        }`}>
          <span className={`text-[10px] sm:text-xs md:text-sm font-bold text-center transition-all duration-300 leading-tight ${
            isPast 
              ? 'text-primary/40 group-hover:text-primary/60' 
              : 'text-primary/60 group-hover:text-primary'
          }`}>
            {brand.name}
          </span>
        </div>
      )}

      {/* External link indicator on hover (only if has URL) */}
      {brand.websiteUrl && isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center shadow-lg"
        >
          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" />
        </motion.div>
      )}

      {/* Brand name tooltip on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg z-20"
        >
          {brand.name}
        </motion.div>
      )}
    </motion.div>
  );

  // If brand has a website URL, wrap in anchor tag
  if (brand.websiteUrl) {
    return (
      <a 
        href={brand.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="outline-none focus:outline-none"
      >
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
};

export default BrandLogos;
