import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlatformIntegrations } from "@/hooks/use-data";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, AlertTriangle, Instagram, RefreshCcw, Loader2, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow, addDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

const IntegrationsManager = () => {
  const { integrations, saveToken, loading } = usePlatformIntegrations();
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [newToken, setNewToken] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const instagramIntegration = integrations?.find(i => i.platform === 'instagram');

  const handleSaveToken = async (platform: string) => {
    if (!newToken.trim()) {
      toast.error("El token no puede estar vacío");
      return;
    }

    setIsUpdating(true);
    try {
      // In a real OAuth flow, we'd get the expiry from the API
      // For manual tokens, we'll estimate 60 days from now
      const expiry = addDays(new Date(), 60).toISOString();
      await saveToken(platform, newToken, expiry);
      toast.success("Token de Instagram actualizado correctamente");
      setNewToken("");
    } catch (error) {
      console.error("Save token error:", error);
      toast.error("Error al guardar el token");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleShowToken = (id: string) => {
    setShowToken(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getExpirationStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const expired = isPast(date);
    const distance = formatDistanceToNow(date, { addSuffix: true, locale: es });
    
    return { expired, distance };
  };

  const status = getExpirationStatus(instagramIntegration?.expires_at);

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Instagram className="w-5 h-5" />
            Integración con Instagram Graph API
          </CardTitle>
          <CardDescription>
            Configura el Access Token para automatizar las métricas de tus campañas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {instagramIntegration ? (
            <div className="p-4 rounded-lg bg-muted/50 border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Conectado</span>
                </div>
                {status && (
                  <div className={`text-sm flex items-center gap-1.5 ${status.expired ? 'text-destructive' : 'text-amber-600'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Expira {status.distance}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Token Actual</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showToken['ig'] ? 'text' : 'password'}
                      value={instagramIntegration.access_token}
                      readOnly
                      className="pr-10 font-mono text-xs bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowToken('ig')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showToken['ig'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setNewToken("")} className="shrink-0">
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-700">Sin conexión</p>
                <p className="text-muted-foreground">Configura un token para empezar a sincronizar métricas automáticamente.</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {instagramIntegration ? "Actualizar Token" : "Configurar Nuevo Token"}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="new-token">Long-Lived Access Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-token"
                    placeholder="E|AAQB..."
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={() => handleSaveToken('instagram')} 
                  disabled={isUpdating || !newToken}
                  className="gradient-primary text-primary-foreground min-w-[120px]"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Obtén tu token en el <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="underline text-primary">Graph API Explorer</a>. Asegúrate de que tenga los permisos <code>instagram_basic</code> y <code>instagram_manage_insights</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-dashed border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary">¿Cómo funciona el modo híbrido?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Una vez configurado el token, podrás ir a cada campaña y cambiar su fuente a <strong>API</strong>. 
                El sistema traerá el alcance y las impresiones reales desde Instagram. Si necesitas corregir un dato de la API, 
                usa el campo <strong>Override</strong> para superponer tu valor manual sin perder la conexión.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsManager;
