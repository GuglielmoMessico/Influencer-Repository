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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Inicio" 
        description="Portal oficial de influencers y gestión de campañas digitales. Optimiza tu ROI con los mejores talentos."
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
