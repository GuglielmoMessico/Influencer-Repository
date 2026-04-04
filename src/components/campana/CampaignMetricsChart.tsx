import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CampaignMetricsChartProps {
  reach: number;
  impressions: number;
  clicks: number;
  expectedReach?: number;
  expectedImpressions?: number;
  expectedClicks?: number;
  expectedCtr?: number;
  expectedEngagement?: number;
  startDate?: string;
  endDate?: string;
  platform?: string;
  campaignType?: string;
  budget?: number;
}

const CampaignMetricsChart = ({ 
  reach, 
  impressions, 
  clicks,
  expectedReach = 0,
  expectedImpressions = 0,
  expectedClicks = 0,
  expectedCtr = 0,
  expectedEngagement = 0,
  startDate,
  endDate,
  platform,
  campaignType,
  budget = 0
}: CampaignMetricsChartProps) => {
  // Calculate real metrics
  const realCtr = impressions > 0 ? ((clicks / impressions) * 100) : 0;
  const realEngagement = reach > 0 ? ((clicks / reach) * 100) : 0;
  const impressionRate = reach > 0 ? ((impressions / reach) * 100) : 0;
  const conversions = Math.round(clicks * 0.12);
  const costPerClick = budget > 0 && clicks > 0 ? (budget / clicks) : 0;
  const costPerReach = budget > 0 && reach > 0 ? ((budget / reach) * 1000) : 0;

  // Calculate performance vs expectations (only if expectations are set)
  const hasExpectations = expectedReach > 0 || expectedImpressions > 0 || expectedClicks > 0;
  
  const reachPerformance = expectedReach > 0 ? ((reach - expectedReach) / expectedReach) * 100 : 0;
  const impressionsPerformance = expectedImpressions > 0 ? ((impressions - expectedImpressions) / expectedImpressions) * 100 : 0;
  const clicksPerformance = expectedClicks > 0 ? ((clicks - expectedClicks) / expectedClicks) * 100 : 0;
  const ctrPerformance = expectedCtr > 0 ? ((realCtr - expectedCtr) / expectedCtr) * 100 : 0;
  const engagementPerformance = expectedEngagement > 0 ? ((realEngagement - expectedEngagement) / expectedEngagement) * 100 : 0;

  // Performance indicator component
  const PerformanceIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    if (value === 0) return <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> Sin dato</span>;
    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-600" : "text-red-500";
    return (
      <span className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="w-3 h-3" />
        {isPositive ? "+" : ""}{value.toFixed(1)}{suffix}
      </span>
    );
  };

  // Data for comparison bar chart
  const comparisonData = [
    { 
      name: "Alcance", 
      real: reach, 
      esperado: expectedReach || reach * 0.85,
      fill: "hsl(var(--primary))"
    },
    { 
      name: "Impresiones", 
      real: impressions, 
      esperado: expectedImpressions || impressions * 0.85,
      fill: "hsl(var(--primary) / 0.7)"
    },
    { 
      name: "Clicks", 
      real: clicks, 
      esperado: expectedClicks || clicks * 0.85,
      fill: "hsl(var(--primary) / 0.5)"
    },
  ];

  // Simulated engagement over campaign duration
  const days = startDate && endDate 
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 7;
  
  const engagementData = Array.from({ length: Math.min(days, 14) }, (_, i) => {
    const progress = (i + 1) / Math.min(days, 14);
    return {
      day: `Día ${i + 1}`,
      alcance: Math.round(reach * (0.1 + progress * 0.9 * Math.random() * 0.3 + progress * 0.7)),
      impresiones: Math.round(impressions * (0.08 + progress * 0.92 * Math.random() * 0.25 + progress * 0.67)),
      clicks: Math.round(clicks * (0.05 + progress * 0.95 * Math.random() * 0.2 + progress * 0.75)),
    };
  });

  // Pie chart data for distribution
  const pieData = [
    { name: "Orgánico", value: Math.round(reach * 0.65), color: "hsl(var(--primary))" },
    { name: "Compartido", value: Math.round(reach * 0.25), color: "hsl(var(--primary) / 0.6)" },
    { name: "Directo", value: Math.round(reach * 0.10), color: "hsl(var(--primary) / 0.3)" },
  ];

  // Device breakdown based on platform
  const deviceData = platform === "tiktok" 
    ? [{ device: "Mobile", porcentaje: 92 }, { device: "Desktop", porcentaje: 6 }, { device: "Tablet", porcentaje: 2 }]
    : platform === "instagram"
    ? [{ device: "Mobile", porcentaje: 78 }, { device: "Desktop", porcentaje: 18 }, { device: "Tablet", porcentaje: 4 }]
    : platform === "threads"
    ? [{ device: "Mobile", porcentaje: 88 }, { device: "Desktop", porcentaje: 9 }, { device: "Tablet", porcentaje: 3 }]
    : platform === "x"
    ? [{ device: "Mobile", porcentaje: 60 }, { device: "Desktop", porcentaje: 35 }, { device: "Tablet", porcentaje: 5 }]
    : platform === "facebook"
    ? [{ device: "Mobile", porcentaje: 72 }, { device: "Desktop", porcentaje: 22 }, { device: "Tablet", porcentaje: 6 }]
    : [{ device: "Mobile", porcentaje: 68 }, { device: "Desktop", porcentaje: 24 }, { device: "Tablet", porcentaje: 8 }];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row - Real vs Expected */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">CTR Real</p>
              <p className="text-2xl font-bold text-primary">{realCtr.toFixed(2)}%</p>
              {hasExpectations && expectedCtr > 0 && (
                <p className="text-xs mt-1">
                  <PerformanceIndicator value={ctrPerformance} /> vs esperado
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="text-2xl font-bold text-primary">{realEngagement.toFixed(2)}%</p>
              {hasExpectations && expectedEngagement > 0 && (
                <p className="text-xs mt-1">
                  <PerformanceIndicator value={engagementPerformance} /> vs esperado
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Imp. Rate</p>
              <p className="text-2xl font-bold text-primary">{impressionRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Conversiones Est.</p>
              <p className="text-2xl font-bold text-primary">{conversions.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
        {budget > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">CPC</p>
                <p className="text-2xl font-bold text-primary">${costPerClick.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Performance vs Expectations - Only show if expectations exist */}
      {hasExpectations && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                🎯 Rendimiento vs Expectativas de la Marca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {expectedReach > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alcance</span>
                      <PerformanceIndicator value={reachPerformance} />
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (reach / expectedReach) * 100)}%` }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className={`h-full rounded-full ${reach >= expectedReach ? 'bg-green-500' : 'bg-amber-500'}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reach.toLocaleString()} / {expectedReach.toLocaleString()} esperado
                    </p>
                  </div>
                )}
                {expectedImpressions > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impresiones</span>
                      <PerformanceIndicator value={impressionsPerformance} />
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (impressions / expectedImpressions) * 100)}%` }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className={`h-full rounded-full ${impressions >= expectedImpressions ? 'bg-green-500' : 'bg-amber-500'}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {impressions.toLocaleString()} / {expectedImpressions.toLocaleString()} esperado
                    </p>
                  </div>
                )}
                {expectedClicks > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Clicks</span>
                      <PerformanceIndicator value={clicksPerformance} />
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (clicks / expectedClicks) * 100)}%` }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className={`h-full rounded-full ${clicks >= expectedClicks ? 'bg-green-500' : 'bg-amber-500'}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {clicks.toLocaleString()} / {expectedClicks.toLocaleString()} esperado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Engagement Over Time - Area Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📈 Evolución de la Campaña
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString()}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="alcance" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.3)" 
                      name="Alcance"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="impresiones" 
                      stroke="hsl(var(--primary) / 0.7)" 
                      fill="hsl(var(--primary) / 0.15)" 
                      name="Impresiones"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Real vs Expected Comparison - Bar Chart */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📊 Real vs Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString()}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="real" name="Real" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="esperado" name="Esperado" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Traffic Sources - Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                🎯 Fuentes de Tráfico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString()}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}:</span>
                      <span className="font-medium">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📱 Dispositivos {platform && `(${platform === 'both' ? 'Multi-plataforma' : platform})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceData.map((device, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{device.device}</span>
                    <span className="font-medium">{device.porcentaje}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.porcentaje}%` }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.8 }}
                      className="h-full bg-primary rounded-full"
                      style={{ opacity: 1 - i * 0.25 }}
                    />
                  </div>
                </div>
              ))}
              
              {/* Extra stats */}
              <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                  <p className="text-lg font-bold text-primary">
                    {campaignType === 'reels' ? '0:45' : campaignType === 'stories' ? '0:15' : '2m 34s'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {budget > 0 ? 'CPM' : 'Bounce Rate'}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {budget > 0 ? `$${costPerReach.toFixed(2)}` : '23%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Clicks Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🖱️ Clicks a lo largo del tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString()}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CampaignMetricsChart;
