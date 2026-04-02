import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/home/Hero";
import LiveStats from "@/components/home/LiveStats";
import AudienceCharts from "@/components/home/AudienceCharts";
import TopContent from "@/components/home/TopContent";
import Services from "@/components/home/Services";
import Testimonials from "@/components/home/Testimonials";
import BrandLogos from "@/components/home/BrandLogos";
import SEO from "@/components/SEO";

import { useCreator } from "@/context/CreatorContext";
import CreatorSelector from "@/components/CreatorSelector";
import { Loader2, AlertCircle } from "lucide-react";

const Index = () => {
  const { creatorId, loading, error, slug } = useCreator();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Iniciando plataforma...</span>
      </div>
    );
  }

  // Si hay un error (creador no encontrado en el slug actual)
  if (error && slug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Acceso no válido</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <CreatorSelector 
          title="Prueba con otro perfil" 
          description="O selecciona uno de los creadores oficiales en la red."
        />
        <Footer />
      </div>
    );
  }

  // Si no hay creador seleccionado (ruta neutral "/")
  if (!creatorId || !slug) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO 
          title="Directorio de Creadores" 
          description="Portal oficial de influencers y gestión de campañas digitales. Optimiza tu ROI con los mejores talentos."
        />
        <div className="flex-1 flex items-center justify-center py-12">
          <CreatorSelector 
            title="Yefer Showw Network" 
            description="Bienvenido al portal oficial de talentos. Selecciona un creador para ver su media kit."
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Landing page del creador específico
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${slug.toUpperCase()} | Media Kit`} 
        description="Portal oficial de influencer y gestión de campañas digitales. Optimiza tu ROI con los mejores talentos."
      />
      <Navbar />
      <main>
        <Hero />
        <BrandLogos />
        <LiveStats />
        <AudienceCharts />
        <TopContent />
        <Services />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
