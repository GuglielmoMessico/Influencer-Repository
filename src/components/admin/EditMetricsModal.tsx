import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Save, TrendingUp, Info, Globe, Smartphone, MousePointer2, Instagram, Link2, AlertTriangle, RefreshCw } from "lucide-react";
import { Campaign } from "@/lib/data";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface EditMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSave: (id: string, updates: Partial<Campaign>) => Promise<any>;
}

export const EditMetricsModal: React.FC<EditMetricsModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSave
}) => {
  const [metrics, setMetrics] = useState<Partial<Campaign>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && campaign) {
      // Initialize metrics from campaign
      setMetrics({
        real_reach_instagram: campaign.real_reach_instagram || 0,
        real_reach_tiktok: campaign.real_reach_tiktok || 0,
        real_reach_facebook: campaign.real_reach_facebook || 0,
        real_reach_x: campaign.real_reach_x || 0,
        real_reach_threads: campaign.real_reach_threads || 0,
        real_impressions: campaign.real_impressions || 0,
        real_clicks: campaign.real_clicks || 0,
        metrics_reach: campaign.metrics_reach || 0,
        metrics_source: campaign.metrics_source || 'manual',
        external_post_id: campaign.external_post_id || '',
        override_reach: campaign.override_reach,
        override_impressions: campaign.override_impressions
      });

      // Date-locking logic
      const acceptedDate = campaign.accepted_at ? new Date(campaign.accepted_at) : new Date(campaign.start_date || Date.now());
      
      // Unlock starts at the beginning of the next day
      const nextDay = new Date(acceptedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      
      const now = new Date();
      if (now < nextDay) {
        setIsLocked(true);
        setUnlockDate(nextDay);
      } else {
        setIsLocked(false);
      }
    }
  }, [isOpen, campaign]);

  // Calculate total reach whenever platform reach changes
  const calculateTotalReach = (updatedMetrics: Partial<Campaign>) => {
    const total = 
      (Number(updatedMetrics.real_reach_instagram) || 0) +
      (Number(updatedMetrics.real_reach_tiktok) || 0) +
      (Number(updatedMetrics.real_reach_facebook) || 0) +
      (Number(updatedMetrics.real_reach_x) || 0) +
      (Number(updatedMetrics.real_reach_threads) || 0);
    
    return total;
  };

  const handleChange = (field: keyof Campaign, value: string) => {
    const numValue = parseInt(value) || 0;
    const newMetrics = { ...metrics, [field]: numValue };
    
    // If it's a reach field, update total reach automatically
    if (field.toString().startsWith('real_reach_')) {
      newMetrics.metrics_reach = calculateTotalReach(newMetrics);
    }
    
    setMetrics(newMetrics);
  };

  const handleSave = async () => {
    if (isLocked) {
      toast.error("Esta campaña aún está bloqueada para edición");
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(campaign.id, metrics);
      if (result) {
        toast.success("Métricas actualizadas correctamente");
        onClose();
      } else {
        toast.error("Error al actualizar métricas");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error inesperado al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!metrics.external_post_id) {
      toast.error("Ingresa un ID de post o URL antes de sincronizar");
      return;
    }

    setIsSyncing(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase-client');
      const supabase = getSupabaseClient();
      
      if (!supabase) throw new Error("Supabase client not available");

      const { data, error } = await supabase.functions.invoke('instagram-sync', {
        body: { campaignId: campaign.id }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Métricas sincronizadas correctamente");
        // Refrescar datos locales (esto debería venir de useCampaigns refresh si se pasa props)
        // Por ahora, asumimos que el usuario verá el cambio al cerrar/abrir o el dashboard refresca
        // Actualizamos localmente para feedback inmediato
        setMetrics(prev => ({
          ...prev,
          real_reach_api: data.metrics.reach,
          real_impressions_api: data.metrics.impressions,
          api_sync_status: 'success'
        }));
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(`Error de sincronización: ${error.message || "Error desconocido"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            Gestionar Métricas Reales
          </DialogTitle>
          <DialogDescription>
            {campaign.brand_name} - {campaign.campaign_code}
          </DialogDescription>
        </DialogHeader>

        {isLocked ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex gap-3 items-start mb-4">
            <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-700 dark:text-amber-400">Edición Bloqueada</p>
              <p className="text-muted-foreground">
                Por seguridad, las métricas reales solo pueden editarse a partir del día siguiente de la fecha de inicio.
              </p>
              {unlockDate && (
                <p className="mt-2 font-medium">
                  Disponible el: {format(unlockDate, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg flex gap-3 items-start mb-4">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-muted-foreground">
                Configura cómo se obtienen los resultados reales para esta campaña.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-4">
          {/* Source Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Fuente de Datos
            </Label>
            <Tabs 
              value={metrics.metrics_source} 
              onValueChange={(val) => setMetrics(prev => ({ ...prev, metrics_source: val as any }))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Instagram API
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {metrics.metrics_source === 'api' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Instagram className="w-5 h-5" />
                  Configuración de API
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_id" className="text-xs">Instagram Media ID o URL del Post</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="post_id"
                        placeholder="ID del post o URL completa"
                        value={metrics.external_post_id}
                        onChange={(e) => setMetrics(prev => ({ ...prev, external_post_id: e.target.value }))}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleSync} 
                      disabled={isSyncing || !metrics.external_post_id}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-9"
                    >
                      {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sincronizar"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    El ID se usará para consultar estadísticas reales (Reach, Impressions, Engagement).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Reach API</Label>
                    <div className="bg-background rounded-md px-3 py-2 border font-mono text-sm">
                      {campaign.real_reach_api?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Impressions API</Label>
                    <div className="bg-background rounded-md px-3 py-2 border font-mono text-sm">
                      {campaign.real_impressions_api?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-600 font-semibold mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Manual Overrides (Opcional)
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Si los datos de la API no son correctos o deseas ajustarlos para el reporte oficial, 
                  ingresa valores aquí. El override tiene prioridad máxima.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="over_reach" className="text-xs">Override Reach</Label>
                    <Input
                      id="over_reach"
                      type="number"
                      placeholder="Sin override"
                      value={metrics.override_reach || ''}
                      onChange={(e) => setMetrics(prev => ({ ...prev, override_reach: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="h-9 border-amber-500/20 focus:border-amber-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="over_imp" className="text-xs">Override Impressions</Label>
                    <Input
                      id="over_imp"
                      type="number"
                      placeholder="Sin override"
                      value={metrics.override_impressions || ''}
                      onChange={(e) => setMetrics(prev => ({ ...prev, override_impressions: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="h-9 border-amber-500/20 focus:border-amber-500/40"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reach_ig" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reach Instagram</Label>
                  <Input
                    id="reach_ig"
                    type="number"
                    value={metrics.real_reach_instagram}
                    onChange={(e) => handleChange('real_reach_instagram', e.target.value)}
                    disabled={isLocked || isSaving}
                    className="border-primary/20"
                    placeholder="0"
                  />
                </div>
            <div className="space-y-2">
              <Label htmlFor="reach_tt" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reach TikTok</Label>
              <Input
                id="reach_tt"
                type="number"
                value={metrics.real_reach_tiktok}
                onChange={(e) => handleChange('real_reach_tiktok', e.target.value)}
                disabled={isLocked || isSaving}
                className="border-primary/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reach_fb" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reach Facebook</Label>
              <Input
                id="reach_fb"
                type="number"
                value={metrics.real_reach_facebook}
                onChange={(e) => handleChange('real_reach_facebook', e.target.value)}
                disabled={isLocked || isSaving}
                className="border-primary/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reach_x" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reach X</Label>
              <Input
                id="reach_x"
                type="number"
                value={metrics.real_reach_x}
                onChange={(e) => handleChange('real_reach_x', e.target.value)}
                disabled={isLocked || isSaving}
                className="border-primary/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reach_th" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reach Threads</Label>
              <Input
                id="reach_th"
                type="number"
                value={metrics.real_reach_threads}
                onChange={(e) => handleChange('real_reach_threads', e.target.value)}
                disabled={isLocked || isSaving}
                className="border-primary/20"
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-primary/20">
            <div className="flex justify-between items-center">
              <Label className="font-bold text-primary">Alcance Total (Auto)</Label>
              <span className="text-xl font-bold text-primary">
                {metrics.metrics_reach?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="impressions" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impresiones Totales</Label>
              <Input
                id="impressions"
                type="number"
                value={metrics.real_impressions}
                onChange={(e) => handleChange('real_impressions', e.target.value)}
                disabled={isLocked || isSaving}
                className="border-primary/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clicks" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clicks Totales</Label>
              <Input
                id="clicks"
                type="number"
                value={metrics.real_clicks}
                onChange={(e) => handleChange('real_clicks', e.target.value)}
                disabled={isLocked || isSaving}
                className="border-primary/20"
                placeholder="0"
              />
            </div>
            </div>
          </div>
        )}
      </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLocked || isSaving}
            className="gradient-primary text-primary-foreground"
          >
            {isSaving ? "Guardando..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Resultados
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
