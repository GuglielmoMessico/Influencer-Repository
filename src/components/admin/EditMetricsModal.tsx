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
import { AlertCircle, Lock, Save, TrendingUp, Info } from "lucide-react";
import { Campaign } from "@/lib/data";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
        metrics_reach: campaign.metrics_reach || 0
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
            <p className="text-xs text-muted-foreground">
              Ingresa los alcances por plataforma. El <strong>Alcance Total</strong> se calculará automáticamente como la suma de todos.
            </p>
          </div>
        )}

        <div className="grid gap-6 py-4">
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
