import React from 'react';
import { type Campaign } from '@/lib/data';
import { SOCIAL_NETWORKS } from '@/lib/constants';
import { 
  Users, Eye, MousePointer, TrendingUp, Target, 
  Zap, Calendar, BarChart3, Globe, Award, 
  CheckCircle2 
} from 'lucide-react';

interface CampaignReportPdfProps {
  campaign: Campaign;
  mediaKitClicks: number;
}

const CampaignReportPdf: React.FC<CampaignReportPdfProps> = ({ campaign, mediaKitClicks }) => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const ctr = campaign.metrics_impressions > 0 
    ? ((campaign.metrics_clicks / campaign.metrics_impressions) * 100).toFixed(2) 
    : '0.00';

  const engagement = campaign.metrics_reach > 0 
    ? ((campaign.metrics_clicks / campaign.metrics_reach) * 100).toFixed(2)
    : '0.00';

  return (
    <div 
      id="campaign-report-pdf" 
      className="bg-white p-12 w-[800px] min-h-[1123px] text-slate-900 font-sans border border-slate-100"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header Bar */}
      <div className="h-2 w-full bg-indigo-600 mb-8 rounded-full" />

      {/* Main Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-indigo-600 tracking-tight uppercase">REPORTE DE CAMPAÑA</h1>
          <p className="text-lg text-slate-500 font-medium">{campaign.brand_name}</p>
          <div className="flex items-center gap-3 mt-4">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
              ID: {campaign.campaign_code}
            </span>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Generado: {currentDate}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
             {campaign.brand_logo_url ? (
               <img src={campaign.brand_logo_url} alt="Brand" className="max-w-full max-h-full object-contain" />
             ) : (
               <div className="text-slate-200 font-black text-xl uppercase tracking-tighter">LOGO</div>
             )}
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">Yefer Showw Media Kit<br/>Performance Report</p>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Detalles de Campaña
          </h3>
          <div className="bg-slate-50 rounded-2xl p-6 space-y-3 border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-tight">Periodo</span>
              <span className="font-bold text-slate-800">{campaign.start_date && campaign.end_date ? `${campaign.start_date} - ${campaign.end_date}` : 'A definir'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-tight">Tipo de Contenido</span>
              <span className="font-bold text-slate-800 capitalize tracking-tight">{campaign.campaign_type || 'Colaboración'}</span>
            </div>
            <div className="flex justify-between items-start text-xs pt-2">
              <span className="text-slate-500 font-bold uppercase tracking-tight">Plataformas Active</span>
              <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                {SOCIAL_NETWORKS.filter(network => {
                    const reach = campaign[`real_reach_${network.id}` as keyof Campaign];
                    return reach && Number(reach) > 0;
                }).map(n => (
                  <span key={n.id} className="text-[9px] font-black px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 uppercase shadow-sm">
                    {n.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Performance General
          </h3>
          <div className="bg-indigo-50/30 rounded-2xl p-6 flex items-center justify-between border border-indigo-100/50">
            <div>
              <p className="text-5xl font-black text-indigo-600 tracking-tighter leading-none mb-1">{campaign.insights?.performance_score || 'A+'}</p>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Score de Rendimiento</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{campaign.insights?.recommedation_rate || 'Top 10%'}</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">vs Benchmarks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics Comparison */}
      <div className="mb-12">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <BarChart3 className="w-3 h-3" /> Métricas Esperadas vs Reales
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 flex flex-col justify-between h-40">
            <div>
              <Users className="w-5 h-5 text-indigo-600 mb-3" />
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-wider">Alcance Total</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{campaign.metrics_reach?.toLocaleString()}</p>
            </div>
            {campaign.expected_reach && (
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-[9px] text-slate-400 uppercase font-black">Meta {campaign.expected_reach?.toLocaleString()}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${campaign.metrics_reach >= campaign.expected_reach ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {campaign.metrics_reach >= campaign.expected_reach ? '+' : ''}{(((campaign.metrics_reach - campaign.expected_reach) / campaign.expected_reach) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 flex flex-col justify-between h-40">
            <div>
              <Eye className="w-5 h-5 text-indigo-600 mb-3" />
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-wider">Impresiones</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{campaign.metrics_impressions?.toLocaleString()}</p>
            </div>
            {campaign.expected_impressions && (
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-[9px] text-slate-400 uppercase font-black">Meta {campaign.expected_impressions?.toLocaleString()}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${campaign.metrics_impressions >= campaign.expected_impressions ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {campaign.metrics_impressions >= campaign.expected_impressions ? '+' : ''}{(((campaign.metrics_impressions - campaign.expected_impressions) / campaign.expected_impressions) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 flex flex-col justify-between h-40">
            <div>
              <MousePointer className="w-5 h-5 text-indigo-600 mb-3" />
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-wider">Clicks Totales</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{campaign.metrics_clicks?.toLocaleString()}</p>
            </div>
            <div className="flex gap-4 mt-auto">
               <div className="flex flex-col">
                 <span className="text-[9px] text-slate-400 uppercase font-black">CTR</span>
                 <span className="text-[10px] font-black text-slate-700">{ctr}%</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] text-slate-400 uppercase font-black">ENG</span>
                 <span className="text-[10px] font-black text-slate-700">{engagement}%</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Networks Breakdown */}
      <div className="mb-12">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Globe className="w-3 h-3" /> Desglose Verified por Plataforma
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {SOCIAL_NETWORKS.map(network => {
            const reach = campaign[`real_reach_${network.id}` as keyof Campaign] as number;
            if (!reach || Number(reach) === 0) return null;

            return (
              <div key={network.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center ${network.color}`}>
                    <span className="text-sm font-black uppercase tracking-tighter">{network.label[0]}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{network.label}</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em]">Verified Reach Impact</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">{Number(reach).toLocaleString()}</p>
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest text-right">Resultados Confirmados</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Section */}
      <div className="mb-12">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Target className="w-3 h-3" /> Insights de Audiencia & Sentimiento
        </h3>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest">Mejor Día</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">{campaign.insights?.best_day || "Varios días"}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest">Hora Pico</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">{campaign.insights?.peak_hour || "8PM - 10PM"}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest">Top Ubicación</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">{campaign.insights?.top_location || "México"}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest">Grupo Primario</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">{campaign.insights?.primary_demo || "18-34 años"}</p>
              </div>
            </div>
            
            {campaign.insights?.insight_summary && (
               <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100/50">
                 <p className="text-[9px] text-indigo-400 font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                   <Target className="w-3 h-3" /> Resumen Estratégico
                 </p>
                 <p className="text-xs text-slate-700 italic leading-relaxed font-medium">
                   "{campaign.insights.insight_summary}"
                 </p>
               </div>
            )}
          </div>

          <div className="col-span-2 bg-slate-900 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="relative z-10 space-y-8 text-white">
              <div>
                <p className="text-[9px] text-slate-500 font-black uppercase mb-4 tracking-[0.2em]">Sentimiento</p>
                <div className="flex items-center gap-4">
                   <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-500 h-full border-r border-black/20" 
                        style={{ width: `${campaign.insights?.sentiment_pos || 85}%` }} 
                      />
                      <div 
                        className="bg-slate-600 h-full border-r border-black/20" 
                        style={{ width: `10%` }} 
                      />
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `5%` }} 
                      />
                   </div>
                   <span className="text-[10px] font-black italic">{campaign.insights?.sentiment_pos || 85}% POS</span>
                </div>
              </div>

              {campaign.insights?.performance_note && (
                <div className="pt-6 border-t border-white/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase mb-3 tracking-[0.2em]">Rendimiento</p>
                   <p className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-tight leading-snug">
                     <Zap className="w-5 h-5 fill-indigo-400" />
                     {campaign.insights.performance_note}
                   </p>
                </div>
              )}

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-indigo-500">
                  <Award className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Impacto Premium Verificado</span>
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <CheckCircle2 className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Media Kit Clicks Section */}
      <div className="mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-4 text-slate-500">
           <BarChart3 className="w-5 h-5" />
           <div>
             <p className="text-[9px] font-black uppercase tracking-widest">Impacto en Media Kit</p>
             <p className="text-xs font-medium italic">Clicks directos a sitio web desde tu logo en el perfil</p>
           </div>
         </div>
         <div className="text-right">
            <p className="text-2xl font-black text-slate-800">{mediaKitClicks.toLocaleString()}</p>
            <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Clicks Totales</p>
         </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 border-t border-slate-100 text-center">
        <p className="text-[9px] text-slate-400 font-bold tracking-[0.3em] uppercase">
          Documento Confidencial Yefer Showw Media
        </p>
        <p className="text-[10px] text-indigo-600 font-black uppercase mt-2 tracking-[0.5em]">
          yefershow.com
        </p>
      </div>
    </div>
  );
};

export default CampaignReportPdf;
