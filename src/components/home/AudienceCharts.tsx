import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useAudienceData } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";

// Colors are now defined dynamically using CSS variables
const getChartColors = () => {
  const root = getComputedStyle(document.documentElement);
  const chart1 = root.getPropertyValue('--chart-1').trim() || '350 59% 19%';
  const chart2 = root.getPropertyValue('--chart-2').trim() || '18 81% 70%';
  return {
    chart1: `hsl(${chart1})`,
    chart2: `hsl(${chart2})`,
  };
};

const AudienceCharts = () => {
  const { genderData, ageData, loading } = useAudienceData();
  const colors = getChartColors();
  
  // Map gender data with colors
  const genderDataWithColors = genderData.map((item, index) => ({
    ...item,
    color: index === 0 ? colors.chart1 : colors.chart2,
  }));

  // Calculate summary text (percentage of main age group)
  const mainAgeGroups = ageData.filter(a => 
    a.age === '25-34' || a.age === '35-44' || a.age === '25-38'
  );
  const mainPercentage = mainAgeGroups.reduce((sum, a) => sum + a.percentage, 0);
  const summaryText = mainPercentage > 0 
    ? `${mainPercentage}% entre 25-38 años` 
    : `${ageData[1]?.percentage || 0}% en rango principal`;

  // No renderizar si no hay datos en Supabase
  if (!loading && genderData.length === 0 && ageData.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto">
          <Skeleton className="h-10 w-64 mx-auto mb-12" />
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-card/50">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-bold text-center text-primary mb-12"
        >
          Conoce Mi Audiencia
        </motion.h2>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Gender Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 shadow-elegant"
          >
            <h3 className="text-lg font-bold text-primary mb-4 text-center">Género</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDataWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {genderDataWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {genderDataWithColors.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Age Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 shadow-elegant"
          >
            <h3 className="text-lg font-bold text-primary mb-4 text-center">Edad</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} layout="vertical">
                  <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="age" width={50} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Audiencia']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: `1px solid ${colors.chart1}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill={colors.chart1} 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <span className="font-bold text-primary">{summaryText}</span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AudienceCharts;
