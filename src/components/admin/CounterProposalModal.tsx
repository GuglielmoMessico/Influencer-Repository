import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  X, 
  Target,
  DollarSign,
  Calendar,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { updateQuoteRequestStatus } from "@/lib/supabase-data";
import { useCounterProposalPDF } from "@/hooks/use-counterproposal-pdf";
import type { QuoteRequest } from "@/lib/supabase-data";

interface CounterProposalModalProps {
  quote: QuoteRequest;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface CounterProposal {
  message: string;
  proposed_reach: number;
  proposed_impressions: number;
  proposed_clicks: number;
  proposed_budget: number;
  proposed_currency: string;
  proposed_start_date: string;
  proposed_end_date: string;
  conditions: string;
}

const CounterProposalModal = ({ quote, open, onClose, onComplete }: CounterProposalModalProps) => {
  const { generatePDF, isGenerating } = useCounterProposalPDF();
  const [isRejecting, setIsRejecting] = useState(false);
  
  const [proposal, setProposal] = useState<CounterProposal>({
    message: `Estimado equipo de ${quote.brand_name},\n\nGracias por su interés en colaborar. Después de revisar su propuesta, me gustaría presentar los siguientes términos ajustados que se alinean mejor con el valor que puedo ofrecer a su marca.`,
    proposed_reach: quote.expected_reach || 0,
    proposed_impressions: quote.expected_impressions || 0,
    proposed_clicks: quote.expected_clicks || 0,
    proposed_budget: quote.budget || 0,
    proposed_currency: quote.budget_currency || 'USD',
    proposed_start_date: quote.start_date || '',
    proposed_end_date: quote.end_date || '',
    conditions: 'Términos sujetos a revisión final. Pago 50% por adelantado, 50% al completar la campaña.',
  });

  const handleDownloadPDF = async () => {
    try {
      await generatePDF(quote, proposal);
      toast.success("PDF generado exitosamente");
    } catch (error) {
      toast.error("Error al generar el PDF");
    }
  };

  const handleRejectAndMark = async () => {
    setIsRejecting(true);
    try {
      // First generate PDF
      await generatePDF(quote, proposal);
      
      // Then update status to rejected
      const success = await updateQuoteRequestStatus(quote.id!, 'rejected' as 'pending' | 'reviewed' | 'contacted');
      
      if (success) {
        toast.success("Cotización rechazada y PDF generado para envío manual");
        onComplete();
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch (error) {
      toast.error("Error en el proceso");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5" />
            Crear Contrapropuesta
          </DialogTitle>
          <DialogDescription>
            Completa los términos ajustados para {quote.brand_name}. El PDF se descargará para que lo envíes manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Request Summary */}
          <section className="p-4 bg-muted/30 rounded-lg border border-dashed">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">📋 Solicitud Original</h4>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <p><span className="text-muted-foreground">Presupuesto:</span> ${quote.budget?.toLocaleString() || 'N/A'} {quote.budget_currency}</p>
              <p><span className="text-muted-foreground">Alcance:</span> {quote.expected_reach?.toLocaleString() || 'N/A'}</p>
              <p><span className="text-muted-foreground">Plataforma:</span> {quote.platform}</p>
            </div>
          </section>

          <Separator />

          {/* Message */}
          <section className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mensaje Inicial
            </Label>
            <Textarea
              value={proposal.message}
              onChange={(e) => setProposal({ ...proposal, message: e.target.value })}
              rows={4}
              placeholder="Introduce tu mensaje personalizado..."
              className="border-primary/20"
            />
          </section>

          <Separator />

          {/* Proposed Metrics */}
          <section className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-primary">
              <Target className="w-4 h-4" />
              Métricas Propuestas
            </h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Alcance Propuesto</Label>
                <Input
                  type="number"
                  value={proposal.proposed_reach}
                  onChange={(e) => setProposal({ ...proposal, proposed_reach: parseInt(e.target.value) || 0 })}
                  className="border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Impresiones Propuestas</Label>
                <Input
                  type="number"
                  value={proposal.proposed_impressions}
                  onChange={(e) => setProposal({ ...proposal, proposed_impressions: parseInt(e.target.value) || 0 })}
                  className="border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Clicks Propuestos</Label>
                <Input
                  type="number"
                  value={proposal.proposed_clicks}
                  onChange={(e) => setProposal({ ...proposal, proposed_clicks: parseInt(e.target.value) || 0 })}
                  className="border-primary/20"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Proposed Budget */}
          <section className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-primary">
              <DollarSign className="w-4 h-4" />
              Presupuesto Propuesto
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={proposal.proposed_budget}
                  onChange={(e) => setProposal({ ...proposal, proposed_budget: parseInt(e.target.value) || 0 })}
                  className="border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={proposal.proposed_currency}
                  onValueChange={(value) => setProposal({ ...proposal, proposed_currency: value })}
                >
                  <SelectTrigger className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Proposed Dates */}
          <section className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-primary">
              <Calendar className="w-4 h-4" />
              Fechas Propuestas
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={proposal.proposed_start_date}
                  onChange={(e) => setProposal({ ...proposal, proposed_start_date: e.target.value })}
                  className="border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Input
                  type="date"
                  value={proposal.proposed_end_date}
                  onChange={(e) => setProposal({ ...proposal, proposed_end_date: e.target.value })}
                  className="border-primary/20"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Conditions */}
          <section className="space-y-3">
            <Label>Condiciones y Notas</Label>
            <Textarea
              value={proposal.conditions}
              onChange={(e) => setProposal({ ...proposal, conditions: e.target.value })}
              rows={3}
              placeholder="Términos y condiciones adicionales..."
              className="border-primary/20"
            />
          </section>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="border-primary/30"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Solo Descargar PDF
          </Button>
          <Button
            onClick={handleRejectAndMark}
            disabled={isRejecting || isGenerating}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            Rechazar y Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CounterProposalModal;
