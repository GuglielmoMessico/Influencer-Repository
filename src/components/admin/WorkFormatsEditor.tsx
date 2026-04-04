import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, Save, GripVertical, Camera, Mic, Users, Award, Sparkles, Video, Megaphone, Heart } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { 
  getWorkFormatsFromSupabase,
  addWorkFormatToSupabase,
  updateWorkFormatInSupabase,
  deleteWorkFormatFromSupabase
} from "@/lib/supabase-data";
import type { WorkFormat } from "@/lib/data";

const iconOptions = [
  { value: "Camera", label: "Cámara", icon: Camera },
  { value: "Mic", label: "Micrófono", icon: Mic },
  { value: "Users", label: "Usuarios", icon: Users },
  { value: "Award", label: "Premio", icon: Award },
  { value: "Sparkles", label: "Estrellas", icon: Sparkles },
  { value: "Video", label: "Video", icon: Video },
  { value: "Megaphone", label: "Megáfono", icon: Megaphone },
  { value: "Heart", label: "Corazón", icon: Heart },
];

const defaultFormats: WorkFormat[] = [
  { id: "1", icon: "Camera", title: "Brand Integration", description: "Reels y TikToks con narrativa orgánica que conecta con la audiencia de forma auténtica.", order_index: 0 },
  { id: "2", icon: "Mic", title: "Event Hosting", description: "Presencia y cobertura en vivo de eventos con energía y carisma únicos.", order_index: 1 },
  { id: "3", icon: "Users", title: "UGC Content", description: "Creación de contenido para uso exclusivo de la marca, listo para campañas.", order_index: 2 },
  { id: "4", icon: "Award", title: "Embajador de Marca", description: "Asociaciones a largo plazo que construyen confianza y resultados sostenibles.", order_index: 3 },
];

const WorkFormatsEditor = () => {
  const [formats, setFormats] = useState<WorkFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newFormat, setNewFormat] = useState({
    icon: "Camera",
    title: "",
    description: "",
    order_index: 0
  });

  useEffect(() => {
    loadFormats();
  }, []);

  const loadFormats = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      const supabaseFormats = await getWorkFormatsFromSupabase();
      if (supabaseFormats && supabaseFormats.length > 0) {
        setFormats(supabaseFormats.sort((a, b) => a.order_index - b.order_index));
      } else {
        setFormats(defaultFormats);
      }
    } else {
      setFormats(defaultFormats);
    }
    setLoading(false);
  };

  const handleAddFormat = async () => {
    if (!newFormat.title.trim() || !newFormat.description.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    setSaving(true);
    const formatData = {
      ...newFormat,
      order_index: formats.length
    };

    if (isSupabaseConfigured()) {
      const result = await addWorkFormatToSupabase(formatData);
      if (result) {
        setFormats([...formats, result]);
        toast.success("Formato añadido");
      } else {
        toast.error("Error al guardar. Asegúrate de ejecutar el SQL de creación de tablas.");
      }
    } else {
      const newId = Date.now().toString();
      setFormats([...formats, { ...formatData, id: newId }]);
      toast.warning("Guardado solo localmente (Supabase no configurado)");
    }

    setNewFormat({ icon: "Camera", title: "", description: "", order_index: 0 });
    setSaving(false);
  };

  const handleUpdateFormat = async (id: string, updates: Partial<WorkFormat>) => {
    if (isSupabaseConfigured()) {
      const result = await updateWorkFormatInSupabase(id, updates);
      if (result) {
        setFormats(formats.map(f => f.id === id ? { ...f, ...updates } : f));
        toast.success("Formato actualizado");
      } else {
        toast.error("Error al actualizar");
      }
    } else {
      setFormats(formats.map(f => f.id === id ? { ...f, ...updates } : f));
      toast.success("Actualizado localmente");
    }
  };

  const handleDeleteFormat = async (id: string) => {
    if (isSupabaseConfigured()) {
      const success = await deleteWorkFormatFromSupabase(id);
      if (success) {
        setFormats(formats.filter(f => f.id !== id));
        toast.success("Formato eliminado");
      } else {
        toast.error("Error al eliminar");
      }
    } else {
      setFormats(formats.filter(f => f.id !== id));
      toast.success("Eliminado localmente");
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find(opt => opt.value === iconName);
    return found ? found.icon : Camera;
  };

  if (loading) {
    return (
      <Card className="shadow-elegant border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Cargando formatos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Briefcase className="w-5 h-5" />
          Formatos de Trabajo
        </CardTitle>
        <CardDescription>
          Define los tipos de colaboraciones que ofreces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Formats */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Formatos Actuales ({formats.length})</h4>
          {formats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay formatos. ¡Añade el primero!</p>
          ) : (
            <div className="space-y-3">
              {formats.map((format) => {
                const IconComponent = getIconComponent(format.icon);
                return (
                  <div 
                    key={format.id} 
                    className="p-4 bg-card border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={format.title}
                          onChange={(e) => handleUpdateFormat(format.id, { title: e.target.value })}
                          className="font-medium border-primary/20"
                          placeholder="Título"
                        />
                        <Textarea
                          value={format.description}
                          onChange={(e) => handleUpdateFormat(format.id, { description: e.target.value })}
                          className="border-primary/20 min-h-[60px] text-sm"
                          placeholder="Descripción"
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={format.icon}
                            onValueChange={(value) => handleUpdateFormat(format.id, { icon: value })}
                          >
                            <SelectTrigger className="w-32 border-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <opt.icon className="w-4 h-4" />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={format.order_index}
                            onChange={(e) => handleUpdateFormat(format.id, { order_index: parseInt(e.target.value) || 0 })}
                            className="w-20 border-primary/20"
                            placeholder="Orden"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFormat(format.id)}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Format Form */}
        <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-4">
          <h4 className="font-medium text-primary">Añadir Nuevo Formato</h4>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newFormat.title}
                  onChange={(e) => setNewFormat({ ...newFormat, title: e.target.value })}
                  placeholder="Brand Integration"
                  className="border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Icono</Label>
                <Select
                  value={newFormat.icon}
                  onValueChange={(value) => setNewFormat({ ...newFormat, icon: value })}
                >
                  <SelectTrigger className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newFormat.description}
                onChange={(e) => setNewFormat({ ...newFormat, description: e.target.value })}
                placeholder="Describe este formato de colaboración..."
                className="border-primary/20 min-h-[80px]"
              />
            </div>
            <Button onClick={handleAddFormat} disabled={saving} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Añadir Formato"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkFormatsEditor;
