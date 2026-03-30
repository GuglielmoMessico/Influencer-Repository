import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { TrendingUp, TrendingDown, Target, DollarSign, Eye, MousePointer, BarChart3, Activity, Award, Zap, Link2 } from "lucide-react";
import type { Campaign } from "@/lib/data";
import { getTotalBrandClicks, getAllBrandClicksWithDetails } from "@/lib/supabase-data";

interface CampaignsDashboardProps {
  campaigns: Campaign[];
}

interface BrandClickData {
  campaignId: string;
  brandName: string;
  clicks: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const CampaignsDashboard = ({ campaigns }: CampaignsDashboardProps) => {
  // Brand clicks state
  const [totalBrandClicks, setTotalBrandClicks] = useState(0);
  const [brandClicksData, setBrandClicksData] = useState<BrandClickData[]>([]);

  // Load brand clicks data
  useEffect(() => {
    const loadBrandClicks = async () => {
      const total = await getTotalBrandClicks();
      setTotalBrandClicks(total);
      
      const clicksData = await getAllBrandClicksWithDetails();
      setBrandClicksData(clicksData);
    };
    
    loadBrandClicks();
  }, [campaigns]);

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    if (campaigns.length === 0) {
      return {
        totalReach: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalBudget: 0,
        avgCTR: 0,
        avgEngagement: 0,
        totalExpectedReach: 0,
        totalExpectedImpressions: 0,
        totalExpectedClicks: 0,
        reachPerformance: 0,
        impressionsPerformance: 0,
        clicksPerformance: 0,
        campaignCount: 0,
      };
    }

    const totalReach = campaigns.reduce((sum, c) => sum + (c.metrics_reach || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.metrics_impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.metrics_clicks || 0), 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    const totalExpectedReach = campaigns.reduce((sum, c) => sum + (c.expected_reach || 0), 0);
    const totalExpectedImpressions = campaigns.reduce((sum, c) => sum + (c.expected_impressions || 0), 0);
    const totalExpectedClicks = campaigns.reduce((sum, c) => sum + (c.expected_clicks || 0), 0);

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    // Calculate engagement from campaigns that have expected values
    const campaignsWithEngagement = campaigns.filter(c => c.expected_engagement && c.expected_engagement > 0);
    const avgEngagement = campaignsWithEngagement.length > 0 
      ? campaignsWithEngagement.reduce((sum, c) => sum + (c.expected_engagement || 0), 0) / campaignsWithEngagement.length 
      : 0;

    // Performance percentages
    const reachPerformance = totalExpectedReach > 0 
      ? ((totalReach - totalExpectedReach) / totalExpectedReach) * 100 
      : 0;
    const impressionsPerformance = totalExpectedImpressions > 0 
      ? ((totalImpressions - totalExpectedImpressions) / totalExpectedImpressions) * 100 
      : 0;
    const clicksPerformance = totalExpectedClicks > 0 
      ? ((totalClicks - totalExpectedClicks) / totalExpectedClicks) * 100 
      : 0;

    return {
      totalReach,
      totalImpressions,
      totalClicks,
      totalBudget,
      avgCTR,
      avgEngagement,
      totalExpectedReach,
      totalExpectedImpressions,
      totalExpectedClicks,
      reachPerformance,
      impressionsPerformance,
      clicksPerformance,
      campaignCount: campaigns.length,
    };
  }, [campaigns]);

  // Data for comparison bar chart
  const comparisonData = useMemo(() => {
    return campaigns.map(c => ({
      name: c.brand_name.length > 12 ? c.brand_name.substring(0, 12) + '...' : c.brand_name,
      fullName: c.brand_name,
      reachReal: c.metrics_reach || 0,
      reachExpected: c.expected_reach || 0,
      impressionsReal: c.metrics_impressions || 0,
      impressionsExpected: c.expected_impressions || 0,
      clicksReal: c.metrics_clicks || 0,
      clicksExpected: c.expected_clicks || 0,
    }));
  }, [campaigns]);

  // Data for performance radar chart
  const radarData = useMemo(() => {
    return campaigns.slice(0, 5).map(c => {
      const reachPerf = c.expected_reach && c.expected_reach > 0 
        ? Math.min(((c.metrics_reach || 0) / c.expected_reach) * 100, 200) 
        : 100;
      const impPerf = c.expected_impressions && c.expected_impressions > 0 
        ? Math.min(((c.metrics_impressions || 0) / c.expected_impressions) * 100, 200) 
        : 100;
      const clickPerf = c.expected_clicks && c.expected_clicks > 0 
        ? Math.min(((c.metrics_clicks || 0) / c.expected_clicks) * 100, 200) 
        : 100;
      
      return {
        campaign: c.brand_name.substring(0, 10),
        reach: reachPerf,
        impressions: impPerf,
        clicks: clickPerf,
        fullMark: 150,
      };
    });
  }, [campaigns]);

  // Data for platform distribution
  const platformData = useMemo(() => {
    const platformCounts: Record<string, { count: number; reach: number; budget: number }> = {
      instagram: { count: 0, reach: 0, budget: 0 },
      tiktok: { count: 0, reach: 0, budget: 0 },
      both: { count: 0, reach: 0, budget: 0 },
    };

    campaigns.forEach(c => {
      const platform = c.platform || 'instagram';
      platformCounts[platform].count += 1;
      platformCounts[platform].reach += c.metrics_reach || 0;
      platformCounts[platform].budget += c.budget || 0;
    });

    return Object.entries(platformCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name: name === 'both' ? 'Ambas' : name.charAt(0).toUpperCase() + name.slice(1),
        value: data.count,
        reach: data.reach,
        budget: data.budget,
      }));
  }, [campaigns]);

  // Data for ROI comparison (reach per dollar)
  const roiData = useMemo(() => {
    return campaigns
      .filter(c => c.budget && c.budget > 0)
      .map(c => ({
        name: c.brand_name.length > 10 ? c.brand_name.substring(0, 10) + '...' : c.brand_name,
        fullName: c.brand_name,
        roi: (c.metrics_reach || 0) / c.budget,
        cpc: c.metrics_clicks && c.metrics_clicks > 0 ? c.budget / c.metrics_clicks : 0,
        budget: c.budget,
      }))
      .sort((a, b) => b.roi - a.roi);
  }, [campaigns]);

  // Campaign type distribution
  const typeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    campaigns.forEach(c => {
      const type = c.campaign_type || 'reels';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const typeLabels: Record<string, string> = {
      reels: 'Reels',
      stories: 'Stories',
      post: 'Post Feed',
      live: 'Live',
      mixed: 'Mixto',
    };

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: typeLabels[type] || type,
      value: count,
    }));
  }, [campaigns]);

  // Top performers
  const topPerformers = useMemo(() => {
    return campaigns
      .map(c => {
        const reachPerf = c.expected_reach && c.expected_reach > 0 
          ? ((c.metrics_reach || 0) / c.expected_reach - 1) * 100 
          : 0;
        const impPerf = c.expected_impressions && c.expected_impressions > 0 
          ? ((c.metrics_impressions || 0) / c.expected_impressions - 1) * 100 
          : 0;
        const clickPerf = c.expected_clicks && c.expected_clicks > 0 
          ? ((c.metrics_clicks || 0) / c.expected_clicks - 1) * 100 
          : 0;
        
        const avgPerf = (reachPerf + impPerf + clickPerf) / 3;
        
        return {
          ...c,
          avgPerformance: avgPerf,
          reachPerformance: reachPerf,
        };
      })
      .sort((a, b) => b.avgPerformance - a.avgPerformance)
      .slice(0, 5);
  }, [campaigns]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const PerformanceIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </span>
    );
  };

  if (campaigns.length === 0) {
    return (
      <Card className="shadow-elegant border-primary/20">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No hay campañas aún</h3>
          <p className="text-muted-foreground">
            Crea tu primera campaña para ver el dashboard comparativo con métricas y análisis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Alcance Total</p>
                  <p className="text-2xl font-bold text-primary">{formatNumber(metrics.totalReach)}</p>
                </div>
                <Eye className="w-8 h-8 text-primary/30" />
              </div>
              <PerformanceIndicator value={metrics.reachPerformance} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Impresiones Totales</p>
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.totalImpressions)}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500/30" />
              </div>
              <PerformanceIndicator value={metrics.impressionsPerformance} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Clicks Totales</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.totalClicks)}</p>
                </div>
                <MousePointer className="w-8 h-8 text-green-500/30" />
              </div>
              <PerformanceIndicator value={metrics.clicksPerformance} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Inversión Total</p>
                  <p className="text-2xl font-bold text-amber-600">${formatNumber(metrics.totalBudget)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-500/30" />
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.campaignCount} campañas
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CTR Promedio</p>
                <p className="text-xl font-bold">{metrics.avgCTR.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPR (Costo por Reach)</p>
                <p className="text-xl font-bold">
                  ${metrics.totalReach > 0 ? (metrics.totalBudget / metrics.totalReach * 1000).toFixed(2) : '0'}
                </p>
                <p className="text-[10px] text-muted-foreground">por 1K alcanzados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MousePointer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPC (Costo por Click)</p>
                <p className="text-xl font-bold">
                  ${metrics.totalClicks > 0 ? (metrics.totalBudget / metrics.totalClicks).toFixed(2) : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Link2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks Media Kit</p>
                <p className="text-xl font-bold text-purple-600">{totalBrandClicks}</p>
                <p className="text-[10px] text-muted-foreground">desde logos de marca</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reach Comparison */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Alcance: Real vs Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatNumber(value), name === 'reachReal' ? 'Real' : 'Esperado']}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="reachReal" name="Real" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="reachExpected" name="Esperado" fill="hsl(var(--muted-foreground) / 0.3)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Distribución por Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {platformData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} campañas | Reach: ${formatNumber(props.payload.reach)}`,
                        props.payload.name
                      ]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ROI Comparison */}
        {roiData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  ROI: Reach por Dólar Invertido
                </CardTitle>
                <CardDescription className="text-xs">
                  Mayor = mejor rendimiento de inversión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roiData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'roi') return [value.toFixed(1) + ' reach/$', 'ROI'];
                          if (name === 'cpc') return ['$' + value.toFixed(2), 'CPC'];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Bar dataKey="roi" name="ROI" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Campaign Type Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Tipos de Contenido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {typeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Radar */}
      {radarData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Rendimiento Comparativo (% de objetivo alcanzado)
              </CardTitle>
              <CardDescription className="text-xs">
                100% = objetivo cumplido exacto | &gt;100% = superó expectativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="campaign" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <Radar name="Reach" dataKey="reach" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Impressions" dataKey="impressions" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                    <Radar name="Clicks" dataKey="clicks" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1) + '%', '']}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Performers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4" />
              Top Campañas por Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((campaign, index) => (
                <div 
                  key={campaign.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-amber-700 text-white' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{campaign.brand_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{campaign.campaign_code}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {campaign.platform || 'instagram'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${campaign.avgPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {campaign.avgPerformance >= 0 ? '+' : ''}{campaign.avgPerformance.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs expectativa</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CampaignsDashboard;
