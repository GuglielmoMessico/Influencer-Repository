import React, { useState } from "react";
import SEO from "@/components/SEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Send, CheckCircle2, ChevronDown, Building2, Target, FileText, Smartphone, MessageCircle, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuoteRequest, QuoteRequest } from "@/lib/supabase-data";
import { uploadFile } from "@/lib/supabase-storage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const quoteSchema = z.object({
  brand_name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "Máximo 100 caracteres"),
  brand_email: z.string().trim().email("Email inválido").max(255, "Máximo 255 caracteres"),
  brand_whatsapp: z.string().trim().max(20, "Máximo 20 caracteres").optional(),
  brand_info: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
  brand_website_url: z.string().trim().url("URL inválida (incluye https://)").max(500, "Máximo 500 caracteres"),
  platforms: z.array(z.string()).min(1, "Selecciona al menos una plataforma"),
  campaign_types: z.array(z.string()).min(1, "Selecciona al menos un tipo de contenido"),
  script_mode: z.enum(["free", "established"]).default("free"),
  brief_html: z.string().max(5000, "Máximo 5000 caracteres").optional(),
  brief_file: z.any().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  budget: z.coerce.number().min(0).optional().or(z.literal("")),
  budget_currency: z.enum(["USD", "MXN", "EUR", "CAD"]).default("MXN"),
  expected_reach: z.coerce.number().int().min(0).optional().or(z.literal("")),
  expected_impressions: z.coerce.number().int().min(0).optional().or(z.literal("")),
  expected_clicks: z.coerce.number().int().min(0).optional().or(z.literal("")),
  expected_ctr: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  expected_engagement: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  notes: z.string().max(2000, "Máximo 2000 caracteres").optional(),
}).refine((data) => {
  if (data.script_mode === 'established') {
    return !!data.brief_html || (data.brief_file && data.brief_file.length > 0);
  }
  return true;
}, {
  message: "Si seleccionas Guión Establecido, debes adjuntar un PDF o ingresar el contenido HTML",
  path: ["brief_html"],
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

const Cotizacion: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expectationsOpen, setExpectationsOpen] = useState(true);
  const { toast } = useToast();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      brand_name: "",
      brand_email: "",
      brand_website_url: "",
      budget_currency: "MXN",
      notes: "",
    },
  });

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return "No especificado";
    const symbol = currency === 'EUR' ? '€' : currency === 'MXN' || currency === 'USD' || currency === 'CAD' ? '$' : '$';
    return `${symbol}${amount.toLocaleString()} ${currency || 'MXN'}`;
  };

  const onSubmit = async (values: QuoteFormValues) => {
    setIsSubmitting(true);
    try {
      let briefFileUrl = "";
      
      // Manejo de archivo Brief si existe
      if (values.script_mode === 'established' && values.brief_file && values.brief_file[0]) {
        const file = values.brief_file[0];
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        
        const { url, error: uploadError } = await uploadFile('briefs', file, fileName);
        if (url) {
          briefFileUrl = url;
        } else {
          throw new Error(uploadError || "Transmisión del archivo falló");
        }
      }

      const quoteData: Omit<QuoteRequest, 'id' | 'created_at' | 'status'> = {
        brand_name: values.brand_name,
        brand_email: values.brand_email,
        brand_whatsapp: values.brand_whatsapp,
        brand_info: values.brand_info,
        brand_website_url: values.brand_website_url,
        // Mantener compatibilidad legacy enviando el primer elemento
        platform: values.platforms[0] || "mixto",
        platforms: values.platforms,
        campaign_type: values.campaign_types[0] || "mixto",
        campaign_types: values.campaign_types,
        script_mode: values.script_mode,
        brief_file_url: briefFileUrl || undefined,
        brief_file_type: briefFileUrl ? "pdf" : undefined,
        brief_html: values.brief_html || undefined,
        start_date: values.start_date ? format(values.start_date, "yyyy-MM-dd") : undefined,
        end_date: values.end_date ? format(values.end_date, "yyyy-MM-dd") : undefined,
        budget: typeof values.budget === 'number' ? values.budget : undefined,
        budget_currency: values.budget_currency,
        expected_reach: typeof values.expected_reach === 'number' ? values.expected_reach : undefined,
        expected_impressions: typeof values.expected_impressions === 'number' ? values.expected_impressions : undefined,
        expected_clicks: typeof values.expected_clicks === 'number' ? values.expected_clicks : undefined,
        expected_ctr: typeof values.expected_ctr === 'number' ? values.expected_ctr : undefined,
        expected_engagement: typeof values.expected_engagement === 'number' ? values.expected_engagement : undefined,
        notes: values.notes || undefined,
      };

      const result = await submitQuoteRequest(quoteData);
      
      if (result) {
        setIsSubmitted(true);
        toast({
          title: "¡Solicitud enviada!",
          description: "Nos pondremos en contacto contigo pronto.",
        });
      } else {
        throw new Error("Error al enviar");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              ¡Solicitud Recibida!
            </h1>
            <p className="text-muted-foreground mb-8">
              Gracias por tu interés en colaborar. Revisaremos tu solicitud y te contactaremos a la brevedad.
            </p>
            <Button onClick={() => window.location.href = "/"} variant="outline">
              Volver al inicio
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Cotización" 
        description="Solicita una cotización personalizada para tu próxima campaña con influencers. Resultados garantizados."
      />
      <Navbar />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Solicita una Cotización
            </h1>
            <p className="text-muted-foreground text-lg">
              Cuéntanos sobre tu marca y tus objetivos de campaña
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Información de la Marca</CardTitle>
                  </div>
                  <CardDescription>Datos básicos de tu empresa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Corporativo *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contacto@tuempresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brand_whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-green-500" />
                            WhatsApp de la Marca
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+52 123 456 7890" {...field} />
                          </FormControl>
                          <FormDescription>Para contacto directo y rápido</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="brand_website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web o Red Social *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://tuempresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Información adicional de marca</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Cuéntanos brevemente de qué trata tu marca o producto..." 
                            className="min-h-[100px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Sección 2: Detalles de la Campaña */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Detalles de la Campaña</CardTitle>
                  </div>
                  <CardDescription>Especificaciones del contenido deseado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="platforms"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              Plataformas *
                            </FormLabel>
                            <FormDescription>
                              Selecciona una o varias plataformas para tu campaña.
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {["instagram", "tiktok", "facebook", "x", "threads"].map((platform) => (
                              <FormField
                                key={platform}
                                control={form.control}
                                name="platforms"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={platform}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background/50"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(platform)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), platform])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value: string) => value !== platform
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal capitalize cursor-pointer">
                                        {platform}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campaign_types"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Tipo de Contenido *</FormLabel>
                            <FormDescription>
                              ¿Qué formatos necesitas? Puedes marcar varios.
                            </FormDescription>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {["reels", "stories", "post", "live"].map((type) => (
                              <FormField
                                key={type}
                                control={form.control}
                                name="campaign_types"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={type}
                                      className="flex flex-row items-center space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), type])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value: string) => value !== type
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal capitalize cursor-pointer">
                                        {type === "post" ? "Post Feed" : type}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal bg-background",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Fin</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal bg-background",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Presupuesto</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10000"
                              min={0}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget_currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moneda</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="USD" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="MXN">MXN</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sección 3: Expectativas */}
              <Card>
                <Collapsible open={expectationsOpen} onOpenChange={setExpectationsOpen}>
                  <CardHeader className="pb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <CardTitle className="text-lg">Expectativas de Campaña</CardTitle>
                          <CardDescription>Tus metas y objetivos (esencial para cotizar)</CardDescription>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          expectationsOpen && "rotate-180"
                        )}
                      />
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="expected_reach"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alcance Esperado</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="100000" min={0} {...field} />
                              </FormControl>
                              <FormDescription>Personas únicas a alcanzar</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expected_impressions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Impresiones Esperadas</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="500000" min={0} {...field} />
                              </FormControl>
                              <FormDescription>Total de vistas del contenido</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="expected_clicks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Clicks Esperados</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="5000" min={0} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expected_ctr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CTR Esperado (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="2.5"
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expected_engagement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Engagement (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="5.0"
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Sección 4: Notas */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Notas Adicionales</CardTitle>
                  <CardDescription>Cuéntanos más sobre tu proyecto</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe brevemente los objetivos de tu campaña, el producto o servicio a promocionar, o cualquier detalle relevante..."
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </form>
          </Form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Cotizacion;
