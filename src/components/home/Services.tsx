import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Mic, Users, Award, Sparkles, Video, Megaphone, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getWorkFormatsFromSupabase } from "@/lib/supabase-data";
import type { WorkFormat } from "@/lib/data";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Camera,
  Mic,
  Users,
  Award,
  Sparkles,
  Video,
  Megaphone,
  Heart,
};

const Services = () => {
  const [services, setServices] = useState<WorkFormat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      if (isSupabaseConfigured()) {
        const supabaseFormats = await getWorkFormatsFromSupabase();
        // Solo usar datos de Supabase, sin fallback
        setServices(supabaseFormats || []);
      }
      setLoading(false);
    };

    loadServices();
  }, []);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Camera;
  };

  // No renderizar si no hay datos en Supabase
  if (!loading && services.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-primary mb-3 md:mb-4">
            Formatos de Trabajo
          </h2>
          <p className="text-sm md:text-base text-foreground/70 max-w-2xl mx-auto px-4">
            Diferentes formas de colaborar que se adaptan a los objetivos de tu marca
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => {
            const IconComponent = getIcon(service.icon);
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-none shadow-lg hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-card">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
                      {service.title}
                    </h3>
                    <p className="text-xs md:text-sm text-foreground/70 leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
