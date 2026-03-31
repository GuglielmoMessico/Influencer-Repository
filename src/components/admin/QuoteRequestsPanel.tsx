import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Check, 
  X, 
  Search, 
  FileText, 
  Calendar, 
  DollarSign,
  Loader2,
  RefreshCw,
  Trash2,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  getQuoteRequestsFromSupabase, 
  updateQuoteRequestStatus,
  deleteQuoteRequestFromSupabase,
  convertQuoteToCampaign,
  type QuoteRequest 
} from "@/lib/supabase-data";
import QuoteDetailModal from "./QuoteDetailModal";
import CounterProposalModal from "./CounterProposalModal";

interface QuoteRequestsPanelProps {
  onAcceptQuote: (quote: QuoteRequest) => void;
}

type QuoteStatus = 'all' | 'pending' | 'reviewed' | 'contacted' | 'accepted' | 'rejected';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  reviewed: { label: "Revisado", color: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  contacted: { label: "Contactado", color: "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  accepted: { label: "Aceptado", color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
  rejected: { label: "Rechazado", color: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" },
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  x: "X",
  threads: "Threads",
  both: "Ambas",
};

const campaignTypeLabels: Record<string, string> = {
  reels: "Reels",
  stories: "Stories",
  post: "Post Feed",
  live: "Live",
  mixed: "Mixto",
};

const QuoteRequestsPanel = ({ onAcceptQuote }: QuoteRequestsPanelProps) => {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus>('all');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCounterProposalModal, setShowCounterProposalModal] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    const data = await getQuoteRequestsFromSupabase();
    if (data) {
      setQuotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesSearch = !searchTerm || 
      quote.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.brand_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = quotes.filter(q => q.status === 'pending').length;

  const handleViewDetails = (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setShowDetailModal(true);
  };

  const handleAccept = async (quote: QuoteRequest) => {
    // Update status to accepted
    const success = await updateQuoteRequestStatus(quote.id!, 'accepted' as 'pending' | 'reviewed' | 'contacted');
    if (success) {
      toast.success(`Cotización de ${quote.brand_name} aceptada`);
      // Call parent callback to pre-fill campaign form
      onAcceptQuote(quote);
      fetchQuotes();
    } else {
      toast.error("Error al aceptar la cotización");
    }
  };

  const handleReject = (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setShowCounterProposalModal(true);
  };
  
  const handleConvert = async (quote: QuoteRequest) => {
    const result = await convertQuoteToCampaign(quote);
    if (result.success) {
      toast.success("¡Campaña creada automáticamente!", {
        description: `Se ha generado el código: ${result.campaign?.campaign_code}`
      });
      fetchQuotes();
    } else {
      toast.error(result.error || "Error al convertir a campaña");
    }
  };

  const handleDelete = async (quote: QuoteRequest) => {
    if (!confirm(`¿Estás seguro de eliminar la cotización de ${quote.brand_name}?`)) return;
    
    const success = await deleteQuoteRequestFromSupabase(quote.id!);
    if (success) {
      toast.success("Cotización eliminada");
      fetchQuotes();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const handleCounterProposalComplete = () => {
    setShowCounterProposalModal(false);
    setSelectedQuote(null);
    fetchQuotes();
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return "No especificado";
    const symbol = currency === 'EUR' ? '€' : currency === 'MXN' ? '$' : '$';
    return `${symbol}${amount.toLocaleString()} ${currency || 'USD'}`;
  };

  if (loading) {
    return (
      <Card className="shadow-elegant border-primary/20">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando cotizaciones...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                Solicitudes de Cotización
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Gestiona las solicitudes de cotización de marcas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchQuotes}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-primary/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: QuoteStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px] border-primary/20">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="reviewed">Revisados</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="accepted">Aceptados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quotes List */}
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay cotizaciones {statusFilter !== 'all' ? `con estado "${statusConfig[statusFilter]?.label}"` : ''}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-bold text-primary">{quote.brand_name}</h4>
                          <Badge className={statusConfig[quote.status || 'pending'].color}>
                            {statusConfig[quote.status || 'pending'].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>{quote.brand_email}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {quote.created_at ? format(new Date(quote.created_at), "dd MMM yyyy", { locale: es }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Mostrar plataformas (array o legacy field) */}
                          {quote.platforms && quote.platforms.length > 0 ? (
                            quote.platforms.map(p => (
                              <Badge key={p} variant="outline" className="bg-primary/5">
                                {platformLabels[p] || p}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">{platformLabels[quote.platform] || quote.platform}</Badge>
                          )}

                          {/* Mostrar tipos de campaña (array o legacy field) */}
                          {quote.campaign_types && quote.campaign_types.length > 0 ? (
                            quote.campaign_types.map(t => (
                              <Badge key={t} variant="outline" className="border-primary/20">
                                {campaignTypeLabels[t] || t}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">{campaignTypeLabels[quote.campaign_type] || quote.campaign_type}</Badge>
                          )}

                          {quote.brand_whatsapp && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              WA: {quote.brand_whatsapp}
                            </Badge>
                          )}

                          {quote.budget && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(quote.budget, quote.budget_currency)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(quote)}
                          className="border-primary/30"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Ver</span>
                        </Button>
                        {quote.status !== 'accepted' && quote.status !== 'rejected' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAccept(quote)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                              <span className="hidden sm:inline ml-2">Aceptar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(quote)}
                              className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4" />
                              <span className="hidden sm:inline ml-2">Rechazar</span>
                            </Button>
                          </>
                        )}

                        {quote.status === 'accepted' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConvert(quote)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <TrendingUp className="w-4 h-4" />
                            <span className="hidden sm:inline ml-2">Convertir</span>
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quote)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedQuote && showDetailModal && (
        <QuoteDetailModal
          quote={selectedQuote}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedQuote(null);
          }}
          onAccept={() => {
            handleAccept(selectedQuote);
            setShowDetailModal(false);
          }}
          onReject={() => {
            setShowDetailModal(false);
            handleReject(selectedQuote);
          }}
          onConvert={async () => {
            await handleConvert(selectedQuote);
            setShowDetailModal(false);
          }}
        />
      )}

      {/* Counter Proposal Modal */}
      {selectedQuote && showCounterProposalModal && (
        <CounterProposalModal
          quote={selectedQuote}
          open={showCounterProposalModal}
          onClose={() => {
            setShowCounterProposalModal(false);
            setSelectedQuote(null);
          }}
          onComplete={handleCounterProposalComplete}
        />
      )}
    </>
  );
};

export default QuoteRequestsPanel;
