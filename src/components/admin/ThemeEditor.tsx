import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Palette, RefreshCw, Save, Navigation, User, BarChart3, 
  Briefcase, Quote, Footprints, FormInput, Copy, Check, ChevronDown 
} from "lucide-react";
import { toast } from "sonner";
import { useTheme, type ThemeConfig, DEFAULT_THEME } from "@/hooks/use-theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HslColorPicker } from "react-colorful";

// HSL string format: "H S% L%" -> { h, s, l }
const parseHslString = (hslString: string): { h: number; s: number; l: number } => {
  const parts = hslString.trim().split(/\s+/);
  return {
    h: parseFloat(parts[0]) || 0,
    s: parseFloat(parts[1]?.replace('%', '')) || 0,
    l: parseFloat(parts[2]?.replace('%', '')) || 0,
  };
};

// { h, s, l } -> "H S% L%"
const hslToString = (hsl: { h: number; s: number; l: number }): string => {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
};

// HSL to HEX conversion
const hslToHex = (hslString: string): string => {
  const { h, s, l } = parseHslString(hslString);
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// HEX to HSL conversion
const hexToHsl = (hex: string): string => {
  const cleanHex = hex.replace('#', '');
  
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return "0 0% 50%";
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const isHexColor = (value: string): boolean => {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
};

// Copy button component
const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copiado: ${value}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title={`Copiar ${label}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-600" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
};

// Color picker component with popover
interface ColorPickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorPickerInput = ({ label, value, onChange, description }: ColorPickerInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const hslColor = parseHslString(value);
  const hexColor = hslToHex(value);

  const handleColorChange = (newColor: { h: number; s: number; l: number }) => {
    const hslString = hslToString(newColor);
    setInputValue(hslString);
    onChange(hslString);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (isHexColor(newValue)) {
      const hslValue = hexToHsl(newValue);
      onChange(hslValue);
      toast.success("HEX convertido a HSL", { duration: 1500 });
    } else {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    setInputValue(value);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2 items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-10 h-10 rounded-lg border-2 border-primary/20 shrink-0 shadow-sm cursor-pointer hover:border-primary/40 transition-colors flex items-center justify-center group"
              style={{ backgroundColor: `hsl(${value})` }}
              title="Abrir selector de color"
            >
              <ChevronDown 
                className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" 
                style={{ color: hslColor.l > 50 ? '#000' : '#fff' }}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-3 bg-popover border shadow-lg z-50" 
            align="start"
            sideOffset={8}
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <HslColorPicker color={hslColor} onChange={handleColorChange} />
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">HSL:</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{value}</code>
                    <CopyButton value={value} label="HSL" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">HEX:</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{hexColor}</code>
                    <CopyButton value={hexColor} label="HEX" />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="HSL o #HEX"
          className="border-primary/20 font-mono text-sm flex-1"
        />
        <span className="text-xs font-mono text-muted-foreground hidden sm:block w-20">{hexColor}</span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

// Section Preview Components
const HeaderPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div 
    className="rounded-lg p-3 flex items-center justify-between"
    style={{ backgroundColor: `hsl(${theme.backgroundHsl} / 0.8)` }}
  >
    <div className="font-bold text-sm" style={{ color: `hsl(${theme.primaryHsl})` }}>
      YEFER
    </div>
    <div className="flex gap-2">
      <span 
        className="px-3 py-1 text-xs rounded-full border"
        style={{ 
          borderColor: `hsl(${theme.primaryHsl})`,
          color: `hsl(${theme.primaryHsl})`
        }}
      >
        Soy Marca
      </span>
    </div>
  </div>
);

const HeroPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div 
    className="rounded-lg p-4 space-y-3"
    style={{ backgroundColor: `hsl(${theme.backgroundHsl})` }}
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-12 h-12 rounded-full"
        style={{ backgroundColor: `hsl(${theme.primaryHsl})` }}
      />
      <div>
        <h3 className="font-bold" style={{ color: `hsl(${theme.primaryHsl})` }}>Yefer Showw</h3>
        <p className="text-sm" style={{ color: `hsl(${theme.foregroundHsl})` }}>Creador de contenido</p>
      </div>
    </div>
    <div className="flex gap-2">
      <span 
        className="px-3 py-1 text-xs rounded-full"
        style={{ 
          backgroundColor: `hsl(${theme.primaryHsl})`,
          color: `hsl(${theme.primaryForegroundHsl})`
        }}
      >
        Lifestyle
      </span>
      <span 
        className="px-3 py-1 text-xs rounded-full"
        style={{ 
          backgroundColor: `hsl(${theme.accentHsl})`,
          color: `hsl(${theme.accentForegroundHsl})`
        }}
      >
        Emprendimiento
      </span>
    </div>
  </div>
);

const StatsPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div 
    className="rounded-lg p-4 space-y-3"
    style={{ backgroundColor: `hsl(${theme.cardHsl})` }}
  >
    <h4 className="text-sm font-medium" style={{ color: `hsl(${theme.cardForegroundHsl})` }}>
      Estadísticas
    </h4>
    <div className="flex gap-4 items-end">
      <div className="flex flex-col items-center gap-1">
        <div 
          className="w-6 h-12 rounded-t"
          style={{ backgroundColor: `hsl(${theme.chart1Hsl})` }}
        />
        <span className="text-xs" style={{ color: `hsl(${theme.mutedForegroundHsl})` }}>IG</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div 
          className="w-6 h-8 rounded-t"
          style={{ backgroundColor: `hsl(${theme.chart2Hsl})` }}
        />
        <span className="text-xs" style={{ color: `hsl(${theme.mutedForegroundHsl})` }}>TK</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div 
          className="w-6 h-10 rounded-t"
          style={{ backgroundColor: `hsl(${theme.chart1Hsl})` }}
        />
        <span className="text-xs" style={{ color: `hsl(${theme.mutedForegroundHsl})` }}>YT</span>
      </div>
    </div>
  </div>
);

const ServicesPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div 
    className="rounded-lg p-4 space-y-2"
    style={{ backgroundColor: `hsl(${theme.mutedHsl} / 0.3)` }}
  >
    <h4 className="text-sm font-bold" style={{ color: `hsl(${theme.primaryHsl})` }}>
      Formatos de Trabajo
    </h4>
    <div 
      className="rounded-lg p-3"
      style={{ backgroundColor: `hsl(${theme.cardHsl})` }}
    >
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: `hsl(${theme.primaryHsl} / 0.1)` }}
        >
          <span style={{ color: `hsl(${theme.primaryHsl})` }}>📸</span>
        </div>
        <span className="text-sm" style={{ color: `hsl(${theme.foregroundHsl})` }}>Stories</span>
      </div>
    </div>
  </div>
);

const TestimonialsPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div 
    className="rounded-lg p-4 space-y-2"
    style={{ 
      backgroundColor: `hsl(${theme.cardHsl})`,
      borderBottom: `2px solid hsl(${theme.borderHsl})`
    }}
  >
    <div style={{ color: `hsl(${theme.primaryHsl} / 0.3)` }} className="text-2xl">"</div>
    <p className="text-sm italic" style={{ color: `hsl(${theme.foregroundHsl})` }}>
      Excelente colaboración...
    </p>
    <p className="text-xs" style={{ color: `hsl(${theme.mutedForegroundHsl})` }}>
      — Brand Manager, Empresa
    </p>
  </div>
);

const FooterPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div 
    className="rounded-lg p-4 flex items-center justify-between"
    style={{ backgroundColor: `hsl(${theme.primaryHsl})` }}
  >
    <span className="font-bold text-sm" style={{ color: `hsl(${theme.primaryForegroundHsl})` }}>
      YEFER
    </span>
    <span className="text-xs" style={{ color: `hsl(${theme.primaryForegroundHsl} / 0.6)` }}>
      © 2024
    </span>
  </div>
);

const FormsPreview = ({ theme }: { theme: ThemeConfig }) => (
  <div className="space-y-2">
    <div 
      className="rounded-lg px-3 py-2 text-sm"
      style={{ 
        backgroundColor: `hsl(${theme.inputHsl})`,
        border: `1px solid hsl(${theme.borderHsl})`,
        color: `hsl(${theme.foregroundHsl})`
      }}
    >
      Campo de entrada
    </div>
    <div 
      className="rounded-lg px-3 py-2 text-sm"
      style={{ 
        backgroundColor: `hsl(${theme.inputHsl})`,
        border: `2px solid hsl(${theme.ringHsl})`,
        color: `hsl(${theme.foregroundHsl})`
      }}
    >
      Campo enfocado
    </div>
  </div>
);

const ThemeEditor = () => {
  const { theme, setTheme, updateTheme, loading } = useTheme();

  const handleSaveTheme = async () => {
    const success = await updateTheme(theme);
    if (success) {
      toast.success("Tema guardado en la nube");
    } else {
      toast.error("Error al guardar el tema");
    }
  };

  const handleResetTheme = () => {
    setTheme(DEFAULT_THEME);
    toast.info("Tema restaurado a valores por defecto. Guarda para aplicar.");
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando tema...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Palette className="w-5 h-5" />
            Editor de Colores por Sección
          </CardTitle>
          <CardDescription>
            Personaliza los colores de cada sección del sitio. Haz clic en el cuadro de color para abrir el selector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="header" className="space-y-4">
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="header" className="flex flex-col gap-1 py-2 text-xs">
                <Navigation className="w-4 h-4" />
                <span className="hidden sm:inline">Header</span>
              </TabsTrigger>
              <TabsTrigger value="hero" className="flex flex-col gap-1 py-2 text-xs">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Hero</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex flex-col gap-1 py-2 text-xs">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Gráficos</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex flex-col gap-1 py-2 text-xs">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Servicios</span>
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="flex flex-col gap-1 py-2 text-xs">
                <Quote className="w-4 h-4" />
                <span className="hidden sm:inline">Testimonios</span>
              </TabsTrigger>
              <TabsTrigger value="footer" className="flex flex-col gap-1 py-2 text-xs">
                <Footprints className="w-4 h-4" />
                <span className="hidden sm:inline">Footer</span>
              </TabsTrigger>
              <TabsTrigger value="forms" className="flex flex-col gap-1 py-2 text-xs">
                <FormInput className="w-4 h-4" />
                <span className="hidden sm:inline">Forms</span>
              </TabsTrigger>
            </TabsList>

            {/* Header / Nav */}
            <TabsContent value="header" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Header / Navegación
                  </h3>
                  <ColorPickerInput
                    label="Fondo del Navbar"
                    value={theme.backgroundHsl}
                    onChange={(v) => setTheme({ ...theme, backgroundHsl: v })}
                    description="Color de fondo con transparencia"
                  />
                  <ColorPickerInput
                    label="Logo y Botones"
                    value={theme.primaryHsl}
                    onChange={(v) => setTheme({ ...theme, primaryHsl: v })}
                    description="Color del logo y bordes de botones"
                  />
                  <ColorPickerInput
                    label="Texto en Botón Hover"
                    value={theme.primaryForegroundHsl}
                    onChange={(v) => setTheme({ ...theme, primaryForegroundHsl: v })}
                    description="Texto cuando el botón tiene fondo"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <HeaderPreview theme={theme} />
                </div>
              </div>
            </TabsContent>

            {/* Hero */}
            <TabsContent value="hero" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Hero / Perfil Principal
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorPickerInput
                      label="Fondo de Página"
                      value={theme.backgroundHsl}
                      onChange={(v) => setTheme({ ...theme, backgroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto Principal"
                      value={theme.foregroundHsl}
                      onChange={(v) => setTheme({ ...theme, foregroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Color Primario"
                      value={theme.primaryHsl}
                      onChange={(v) => setTheme({ ...theme, primaryHsl: v })}
                      description="Títulos, badges, botones"
                    />
                    <ColorPickerInput
                      label="Texto sobre Primario"
                      value={theme.primaryForegroundHsl}
                      onChange={(v) => setTheme({ ...theme, primaryForegroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Color de Acento"
                      value={theme.accentHsl}
                      onChange={(v) => setTheme({ ...theme, accentHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto sobre Acento"
                      value={theme.accentForegroundHsl}
                      onChange={(v) => setTheme({ ...theme, accentForegroundHsl: v })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <HeroPreview theme={theme} />
                </div>
              </div>
            </TabsContent>

            {/* Stats & Charts */}
            <TabsContent value="stats" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Estadísticas y Gráficos
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorPickerInput
                      label="Fondo de Cards"
                      value={theme.cardHsl}
                      onChange={(v) => setTheme({ ...theme, cardHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto en Cards"
                      value={theme.cardForegroundHsl}
                      onChange={(v) => setTheme({ ...theme, cardForegroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto Secundario"
                      value={theme.mutedForegroundHsl}
                      onChange={(v) => setTheme({ ...theme, mutedForegroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Bordes"
                      value={theme.borderHsl}
                      onChange={(v) => setTheme({ ...theme, borderHsl: v })}
                    />
                    <ColorPickerInput
                      label="Color Gráfico 1"
                      value={theme.chart1Hsl}
                      onChange={(v) => setTheme({ ...theme, chart1Hsl: v })}
                      description="Barras y pie principal"
                    />
                    <ColorPickerInput
                      label="Color Gráfico 2"
                      value={theme.chart2Hsl}
                      onChange={(v) => setTheme({ ...theme, chart2Hsl: v })}
                      description="Barras y pie secundario"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <StatsPreview theme={theme} />
                </div>
              </div>
            </TabsContent>

            {/* Services */}
            <TabsContent value="services" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Servicios / Formatos de Trabajo
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorPickerInput
                      label="Fondo de Sección"
                      value={theme.mutedHsl}
                      onChange={(v) => setTheme({ ...theme, mutedHsl: v })}
                    />
                    <ColorPickerInput
                      label="Fondo de Cards"
                      value={theme.cardHsl}
                      onChange={(v) => setTheme({ ...theme, cardHsl: v })}
                    />
                    <ColorPickerInput
                      label="Títulos e Iconos"
                      value={theme.primaryHsl}
                      onChange={(v) => setTheme({ ...theme, primaryHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto General"
                      value={theme.foregroundHsl}
                      onChange={(v) => setTheme({ ...theme, foregroundHsl: v })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <ServicesPreview theme={theme} />
                </div>
              </div>
            </TabsContent>

            {/* Testimonials */}
            <TabsContent value="testimonials" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <Quote className="w-4 h-4" />
                    Testimonios
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorPickerInput
                      label="Fondo de Cards"
                      value={theme.cardHsl}
                      onChange={(v) => setTheme({ ...theme, cardHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto de Citas"
                      value={theme.foregroundHsl}
                      onChange={(v) => setTheme({ ...theme, foregroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Icono Quote"
                      value={theme.primaryHsl}
                      onChange={(v) => setTheme({ ...theme, primaryHsl: v })}
                    />
                    <ColorPickerInput
                      label="Texto Secundario"
                      value={theme.mutedForegroundHsl}
                      onChange={(v) => setTheme({ ...theme, mutedForegroundHsl: v })}
                    />
                    <ColorPickerInput
                      label="Borde Inferior"
                      value={theme.borderHsl}
                      onChange={(v) => setTheme({ ...theme, borderHsl: v })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <TestimonialsPreview theme={theme} />
                </div>
              </div>
            </TabsContent>

            {/* Footer */}
            <TabsContent value="footer" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <Footprints className="w-4 h-4" />
                    Footer
                  </h3>
                  <ColorPickerInput
                    label="Fondo del Footer"
                    value={theme.primaryHsl}
                    onChange={(v) => setTheme({ ...theme, primaryHsl: v })}
                    description="Generalmente usa el color primario"
                  />
                  <ColorPickerInput
                    label="Texto y Logo"
                    value={theme.primaryForegroundHsl}
                    onChange={(v) => setTheme({ ...theme, primaryForegroundHsl: v })}
                    description="Color del texto sobre el fondo"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <FooterPreview theme={theme} />
                </div>
              </div>
            </TabsContent>

            {/* Forms */}
            <TabsContent value="forms" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-primary flex items-center gap-2">
                    <FormInput className="w-4 h-4" />
                    Formularios (Global)
                  </h3>
                  <ColorPickerInput
                    label="Color de Borde"
                    value={theme.borderHsl}
                    onChange={(v) => setTheme({ ...theme, borderHsl: v })}
                    description="Bordes de todos los elementos"
                  />
                  <ColorPickerInput
                    label="Fondo de Inputs"
                    value={theme.inputHsl}
                    onChange={(v) => setTheme({ ...theme, inputHsl: v })}
                    description="Fondo de campos de entrada"
                  />
                  <ColorPickerInput
                    label="Ring de Focus"
                    value={theme.ringHsl}
                    onChange={(v) => setTheme({ ...theme, ringHsl: v })}
                    description="Anillo al enfocar elementos"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vista Previa</p>
                  <FormsPreview theme={theme} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-6 border-t mt-6">
            <Button onClick={handleResetTheme} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Valores
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveTheme} className="gradient-primary text-primary-foreground w-full">
        <Save className="w-4 h-4 mr-2" />
        Guardar Tema
      </Button>
    </div>
  );
};

export default ThemeEditor;
