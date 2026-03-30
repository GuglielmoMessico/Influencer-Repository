import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  Mail, 
  Globe, 
  Calendar, 
  DollarSign, 
  Target, 
  Eye as EyeIcon,
  MousePointerClick,
  TrendingUp,
  Users,
  Check,
  X,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { QuoteRequest } from "@/lib/supabase-data";

interface QuoteDetailModalProps {
  quote: QuoteRequest;
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onConvert?: () => Promise<void>;
}

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  both: "Ambas plataformas",
};

const campaignTypeLabels: Record<string, string> = {
  reels: "Reels",
  stories: "Stories",
  post: "Post Feed",
  live: "Live",
  mixed: "Contenido Mixto",
};

const QuoteDetailModal = ({ quote, open, onClose, onAccept, onReject, onConvert }: QuoteDetailModalProps) => {
  const [isConverting, setIsConverting] = useState(false);

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return "No especificado";
    const symbol = currency === 'EUR' ? '€' : currency === 'MXN' || currency === 'USD' || currency === 'CAD' ? '$' : '$';
    return `${symbol}${amount.toLocaleString()} ${currency || 'MXN'}`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return "No especificado";
    return num.toLocaleString();
  };

  const isActionable = quote.status !== 'accepted' && quote.status !== 'rejected';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5" />
            Detalle de Cotización
          </DialogTitle>
          <DialogDescription>
            Solicitud de {quote.brand_name} - {quote.created_at && format(new Date(quote.created_at), "dd MMMM yyyy", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Information */}
          <section className="space-y-3">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Building className="w-4 h-4" />
              Información de la Marca
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{quote.brand_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="font-medium">{quote.brand_email}</p>
              </div>
              {quote.brand_whatsapp && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="text-green-500 font-bold">WA</span> WhatsApp
                  </p>
                  <p className="font-medium">{quote.brand_whatsapp}</p>
                </div>
              )}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Sitio Web
                </p>
                <a 
                  href={quote.brand_website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {quote.brand_website_url}
                </a>
              </div>
              {quote.brand_info && (
                <div className="space-y-1 sm:col-span-2 mt-2 pt-2 border-t border-muted">
                  <p className="text-sm text-muted-foreground">Información de Marca</p>
                  <p className="text-sm italic">{quote.brand_info}</p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Campaign Details */}
          <section className="space-y-3">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Detalles de la Campaña
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Plataformas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {quote.platforms && quote.platforms.length > 0 ? (
                    quote.platforms.map(p => (
                      <Badge key={p} variant="outline" className="bg-primary/5">{platformLabels[p] || p}</Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{platformLabels[quote.platform] || quote.platform}</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tipos de Contenido</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {quote.campaign_types && quote.campaign_types.length > 0 ? (
                    quote.campaign_types.map(t => (
                      <Badge key={t} variant="outline" className="border-primary/20">{campaignTypeLabels[t] || t}</Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{campaignTypeLabels[quote.campaign_type] || quote.campaign_type}</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                <p className="font-medium">
                  {quote.start_date 
                    ? format(new Date(quote.start_date), "dd MMM yyyy", { locale: es })
                    : "No especificada"
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de Fin</p>
                <p className="font-medium">
                  {quote.end_date 
                    ? format(new Date(quote.end_date), "dd MMM yyyy", { locale: es })
                    : "No especificada"
                  }
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Presupuesto
                </p>
                <p className="font-medium text-lg">{formatCurrency(quote.budget, quote.budget_currency)}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Script / Brief Section */}
          <section className="space-y-3">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Estrategia y Guion
            </h3>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Modalidad:</span>
                <Badge variant={quote.script_mode === 'established' ? "default" : "secondary"}>
                  {quote.script_mode === 'established' ? "Guion Establecido" : "Guion Libre"}
                </Badge>
              </div>

              {quote.brief_file_url && (
                <div className="flex items-center justify-between p-3 bg-background rounded border shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium uppercase text-xs tracking-wider">Brief PDF</span>
                  </div>
                  <Button variant="outline" size="sm" asChild className="h-8">
                    <a href={quote.brief_file_url} target="_blank" rel="noopener noreferrer">
                      Ver Documento
                    </a>
                  </Button>
                </div>
              )}

              {quote.brief_html && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Instrucciones / Texto:</p>
                  <div className="p-3 bg-background rounded border text-sm max-h-[150px] overflow-y-auto whitespace-pre-wrap font-mono text-xs shadow-inner">
                    {quote.brief_html}
                  </div>
                </div>
              )}

              {!quote.brief_file_url && !quote.brief_html && quote.script_mode === 'free' && (
                <p className="text-sm italic text-muted-foreground">
                  Libertad creativa para el influencer.
                </p>
              )}
            </div>
          </section>

          <Separator />

          {/* Expectations */}
          <section className="space-y-3">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Target className="w-4 h-4" />
              Expectativas de la Marca
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> Alcance
                </p>
                <p className="font-medium">{formatNumber(quote.expected_reach)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" /> Impresiones
                </p>
                <p className="font-medium">{formatNumber(quote.expected_impressions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" /> Clicks
                </p>
                <p className="font-medium">{formatNumber(quote.expected_clicks)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CTR Esperado</p>
                <p className="font-medium">{quote.expected_ctr ? `${quote.expected_ctr}%` : "No especificado"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Engagement
                </p>
                <p className="font-medium">{quote.expected_engagement ? `${quote.expected_engagement}%` : "No especificado"}</p>
              </div>
            </div>
          </section>

          {/* Notes */}
          {quote.notes && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="font-semibold text-primary">Notas Adicionales</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cerrar
          </Button>

          {isActionable && (
            <>
              <Button
                variant="outline"
                onClick={onReject}
                className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                disabled={isConverting}
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar con Contrapropuesta
              </Button>
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700"
                disabled={isConverting}
              >
                <Check className="w-4 h-4 mr-2" />
                Aceptar Cotización
              </Button>
            </>
          )}

          {quote.status === 'accepted' && onConvert && (
            <Button
              onClick={async () => {
                setIsConverting(true);
                await onConvert();
                setIsConverting(false);
              }}
              disabled={isConverting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
            >
              {isConverting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Convertir a Campaña (Auto)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetailModal;
