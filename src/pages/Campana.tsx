import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignByCodeAndEmail } from "@/hooks/use-data";
import { type Campaign } from "@/lib/data";
import { getBrandClicksForCampaign } from "@/lib/supabase-data";
import { toast } from "sonner";
import { Lock, Mail, Key, TrendingUp, Eye, MousePointer, Users, Download, ExternalLink, BarChart3, Target, Zap, Loader2, FileText, Link2 } from "lucide-react";
import CampaignMetricsChart from "@/components/campana/CampaignMetricsChart";
import { usePdfExport } from "@/hooks/use-pdf-export";
import CampaignReportPdf from "@/components/campana/CampaignReportPdf";
import SEO from "@/components/SEO";
import DOMPurify from "dompurify";

const Campana = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [mediaKitClicks, setMediaKitClicks] = useState(0);
  const { exportToPDF } = usePdfExport();
  const [exporting, setExporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const foundCampaign = await getCampaignByCodeAndEmail(code, email);
      
      if (foundCampaign) {
        setCampaign(foundCampaign);
        // Load media kit clicks for this campaign
        const clicks = await getBrandClicksForCampaign(foundCampaign.id);
        setMediaKitClicks(clicks);
        toast.success(`¡Bienvenido ${foundCampaign.brand_name}!`);
      } else {
        toast.error("Código o email no válido. Verifica tus datos.");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Error al conectar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (campaign) {
      setExporting(true);
      try {
        await exportToPDF(campaign, mediaKitClicks);
        toast.success("Reporte generado con éxito");
      } catch (error) {
        toast.error("Error al generar el PDF");
      } finally {
        setExporting(false);
      }
    }
  };

  if (campaign) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title={`Resultados: ${campaign.brand_name}`} 
          description={`Dashboard de resultados y métricas reales para la campaña ${campaign.campaign_code}. Ver alcance, impresiones y clicks.`}
        />
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div id="campaign-report" className="container mx-auto max-w-6xl">
            {/* Header with brand info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="shadow-elegant border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {campaign.brand_logo_url && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 backdrop-blur-sm p-2 flex items-center justify-center overflow-hidden"
                      >
                        <img 
                          src={campaign.brand_logo_url} 
                          alt={campaign.brand_name}
                          className="w-full h-full object-contain rounded-full"
                        />
                      </motion.div>
                    )}
                    <div className="text-center md:text-left flex-1">
                      <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl md:text-3xl font-bold mb-2"
                      >
                        ¡Hola {campaign.brand_name}! 👋
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-primary-foreground/80"
                      >
                        Dashboard de resultados de tu campaña
                      </motion.p>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 mt-2 justify-center md:justify-start"
                      >
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          Código: {campaign.campaign_code}
                        </span>
                      </motion.div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex gap-2"
                    >
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={handleExportPdf}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-1" />
                            Exportar PDF
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Main Metrics Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-4 gap-6 mb-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-primary/20 shadow-elegant hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Alcance Total</p>
                        <p className="text-3xl font-bold text-primary">
                          {campaign.metrics_reach.toLocaleString()}
                        </p>
                        {campaign.expected_reach && campaign.expected_reach > 0 ? (
                          <p className={`text-xs flex items-center gap-1 ${campaign.metrics_reach >= campaign.expected_reach ? 'text-green-600' : 'text-amber-600'}`}>
                            <TrendingUp className="w-3 h-3" /> 
                            {campaign.metrics_reach >= campaign.expected_reach ? '+' : ''}
                            {(((campaign.metrics_reach - campaign.expected_reach) / campaign.expected_reach) * 100).toFixed(1)}% vs esperado
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin expectativa definida</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-primary/20 shadow-elegant hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Impresiones</p>
                        <p className="text-3xl font-bold text-primary">
                          {campaign.metrics_impressions.toLocaleString()}
                        </p>
                        {campaign.expected_impressions && campaign.expected_impressions > 0 ? (
                          <p className={`text-xs flex items-center gap-1 ${campaign.metrics_impressions >= campaign.expected_impressions ? 'text-green-600' : 'text-amber-600'}`}>
                            <TrendingUp className="w-3 h-3" /> 
                            {campaign.metrics_impressions >= campaign.expected_impressions ? '+' : ''}
                            {(((campaign.metrics_impressions - campaign.expected_impressions) / campaign.expected_impressions) * 100).toFixed(1)}% vs esperado
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin expectativa definida</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-primary/20 shadow-elegant hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MousePointer className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Clicks Totales</p>
                        <p className="text-3xl font-bold text-primary">
                          {campaign.metrics_clicks.toLocaleString()}
                        </p>
                        {campaign.expected_clicks && campaign.expected_clicks > 0 ? (
                          <p className={`text-xs flex items-center gap-1 ${campaign.metrics_clicks >= campaign.expected_clicks ? 'text-green-600' : 'text-amber-600'}`}>
                            <TrendingUp className="w-3 h-3" /> 
                            {campaign.metrics_clicks >= campaign.expected_clicks ? '+' : ''}
                            {(((campaign.metrics_clicks - campaign.expected_clicks) / campaign.expected_clicks) * 100).toFixed(1)}% vs esperado
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin expectativa definida</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Media Kit Clicks Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-purple-500/20 shadow-elegant hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-500/5 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Clicks desde Media Kit</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {mediaKitClicks.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Visitantes que clickearon tu logo
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Charts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CampaignMetricsChart 
                reach={campaign.metrics_reach}
                impressions={campaign.metrics_impressions}
                clicks={campaign.metrics_clicks}
                expectedReach={campaign.expected_reach}
                expectedImpressions={campaign.expected_impressions}
                expectedClicks={campaign.expected_clicks}
                expectedCtr={campaign.expected_ctr}
                expectedEngagement={campaign.expected_engagement}
                startDate={campaign.start_date}
                endDate={campaign.end_date}
                platform={campaign.platform}
                campaignType={campaign.campaign_type}
                budget={campaign.budget}
              />
            </motion.div>

            {/* Video and Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid md:grid-cols-2 gap-6 mt-6"
            >
              {/* Campaign Insights */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-primary" />
                    Insights de la Campaña
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm text-muted-foreground">Mejor día de engagement</span>
                    <span className="font-medium">{campaign.insights?.best_day || "Varios"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm text-muted-foreground">Hora pico</span>
                    <span className="font-medium">{campaign.insights?.peak_hour || "8:00 PM - 10:00 PM"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm text-muted-foreground">Demografía principal</span>
                    <span className="font-medium">{campaign.insights?.primary_demo || "18-34 años"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm text-muted-foreground">Top ubicación</span>
                    <span className="font-medium">{campaign.insights?.top_location || "CDMX, México"}</span>
                  </div>
                  {campaign.insights?.insight_summary && (
                    <div className="mt-4 pt-4 border-t border-primary/10">
                      <p 
                        className="text-sm text-muted-foreground italic leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.insights.insight_summary) }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video & Performance */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    Rendimiento & Contenido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campaign.video_result_url && (
                    <a
                      href={campaign.video_result_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium group-hover:text-primary transition-colors">Ver Video de la Campaña</p>
                        <p className="text-sm text-muted-foreground">Contenido publicado</p>
                      </div>
                    </a>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{campaign.insights?.performance_score || "A+"}</p>
                      <p className="text-xs text-muted-foreground">Performance Score</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{campaign.insights?.recommedation_rate || "Top 10%"}</p>
                      <p className="text-xs text-muted-foreground">vs Campañas similares</p>
                    </div>
                  </div>

                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Sentimiento del contenido</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                        Positivo {campaign.insights?.sentiment_pos || 89}%
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                        Neutral {100 - (campaign.insights?.sentiment_pos || 89) - 2}%
                      </span>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">
                        Negativo 2%
                      </span>
                    </div>
                    {campaign.insights?.performance_note && (
                      <p className="text-[10px] text-primary mt-2 flex items-center gap-1 font-medium">
                        <Zap className="w-3 h-3" /> {campaign.insights.performance_note}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-8 pt-6 border-t border-primary/10 flex flex-col sm:flex-row gap-4 justify-between items-center"
            >
              <Button
                variant="outline"
                onClick={() => setCampaign(null)}
                className="border-primary text-primary"
              >
                ← Volver al formulario
              </Button>
              <p className="text-sm text-muted-foreground">
                ¿Tienes preguntas? Contáctame para más detalles.
              </p>
            </motion.div>
          </div>

          {/* Hidden PDF Template for Capture */}
          <div style={{ display: 'none' }}>
             {campaign && (
               <CampaignReportPdf 
                 campaign={campaign} 
                 mediaKitClicks={mediaKitClicks} 
               />
             )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Portal de Marcas" 
        description="Accede a los resultados detallados de tu campaña con influencers. Visualiza métricas reales e insights de performance."
      />
      <Navbar />
      <main className="pt-24 pb-16 px-4 min-h-[80vh] flex items-center">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-elegant border-primary/20">
              <CardHeader className="text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
                >
                  <Lock className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl text-primary">
                  Portal de Marcas
                </CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para ver los resultados de tu campaña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email Corporativo
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="marketing@tuempresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      Código de Campaña
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="MARCA24"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                      className="border-primary/20 focus:border-primary uppercase"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary text-primary-foreground font-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </motion.span>
                        Verificando...
                      </span>
                    ) : (
                      "Acceder a Resultados"
                    )}
                  </Button>
                </form>
                
                <p className="text-xs text-center text-muted-foreground mt-6">
                  ¿No tienes acceso? Contáctame para colaborar.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Campana;
