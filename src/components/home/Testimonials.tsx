import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, User, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useEmblaCarousel from "embla-carousel-react";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { getTestimonialsFromSupabase } from "@/lib/supabase-data";
import type { Testimonial } from "@/lib/data";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
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

  useEffect(() => {
    const loadTestimonials = async () => {
      if (isSupabaseConfigured()) {
        const supabaseTestimonials = await getTestimonialsFromSupabase();
        if (supabaseTestimonials && supabaseTestimonials.length > 0) {
          setTestimonials(supabaseTestimonials);
        }
      }
      setLoading(false);
    };

    loadTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-pulse text-primary">Cargando testimonios...</div>
        </div>
      </section>
    );
  }

  // No mostrar sección si no hay testimonios
  if (testimonials.length === 0) {
    return null;
  }

  // Use carousel when more than 5 testimonials
  const useCarousel = testimonials.length > 5;

  const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full border-none shadow-lg bg-card hover:shadow-elegant transition-shadow">
        <CardContent className="p-6 flex flex-col h-full">
          <Quote className="w-8 h-8 text-primary/30 mb-4" />
          <p className="text-foreground/80 italic flex-1 leading-relaxed mb-6 text-sm">
            "{testimonial.quote}"
          </p>
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3">
              {testimonial.image_url ? (
                <Avatar className={`${testimonial.image_type === 'logo' ? 'rounded-md' : 'rounded-full'} w-12 h-12`}>
                  <AvatarImage 
                    src={testimonial.image_url} 
                    alt={testimonial.company}
                    className={`${testimonial.image_type === 'logo' ? 'object-contain p-1' : 'object-cover'}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {testimonial.image_type === 'logo' ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-bold text-foreground text-sm">
                  {testimonial.brand}
                </p>
                <p className="text-xs text-foreground/60">
                  {testimonial.company}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4">
            Lo que dicen las marcas
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Historias de éxito de colaboraciones pasadas
          </p>
        </motion.div>

        {useCarousel ? (
          <div className="max-w-5xl mx-auto">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id || index} 
                    className="flex-[0_0_100%] min-w-0 pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                  >
                    <TestimonialCard testimonial={testimonial} index={index} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard 
                key={testimonial.id || index} 
                testimonial={testimonial} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
