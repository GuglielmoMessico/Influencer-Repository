import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, 
  Palette, 
  Image, 
  Save, 
  Plus, 
  X, 
  Link as LinkIcon,
  Instagram,
  Mail,
  MessageSquareQuote,
  Trash2,
  Facebook
} from "lucide-react";
import { 
  type ProfileConfig,
  type Testimonial
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { 
  getProfileFromSupabase, 
  saveProfileToSupabase,
  getTestimonialsFromSupabase,
  addTestimonialToSupabase,
  deleteTestimonialFromSupabase
} from "@/lib/supabase-data";
import ImageUploader from "./ImageUploader";
import StorageImagePicker from "./StorageImagePicker";
import WorkFormatsEditor from "./WorkFormatsEditor";
import ThemeEditor from "./ThemeEditor";

const ProfileEditor = () => {
  const [profile, setProfile] = useState<ProfileConfig | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);

  // New testimonial form state
  const [newTestimonial, setNewTestimonial] = useState({
    quote: "",
    brand: "",
    company: "",
    image_url: "",
    image_type: "logo" as "logo" | "photo"
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (isSupabaseConfigured()) {
        const supabaseProfile = await getProfileFromSupabase();
        const supabaseTestimonials = await getTestimonialsFromSupabase();
        
        if (supabaseProfile) {
          setProfile(supabaseProfile);
        }
        
        if (supabaseTestimonials) {
          setTestimonials(supabaseTestimonials);
        }
      }
      
      setLoading(false);
    };

    loadData();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (isSupabaseConfigured()) {
      const result = await saveProfileToSupabase(profile);
      if (result) {
        toast.success("Perfil guardado en la nube");
      } else {
        toast.error("Error al guardar en Supabase");
      }
    } else {
      toast.error("Supabase no está configurado");
    }
    window.location.reload();
  };

  const addTag = () => {
    if (!profile) return;
    if (newTag.trim() && !profile.tags.includes(newTag.trim())) {
      setProfile({ ...profile, tags: [...profile.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (!profile) return;
    setProfile({ ...profile, tags: profile.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.quote.trim() || !newTestimonial.brand.trim() || !newTestimonial.company.trim()) {
      toast.error("Completa todos los campos del testimonio");
      return;
    }

    if (isSupabaseConfigured()) {
      const result = await addTestimonialToSupabase(newTestimonial);
      if (result) {
        setTestimonials([...testimonials, result]);
        toast.success("Testimonio añadido");
      } else {
        toast.error("Error al añadir testimonio");
      }
    } else {
      toast.error("Supabase no está configurado");
    }

    setNewTestimonial({ quote: "", brand: "", company: "", image_url: "", image_type: "logo" });
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (isSupabaseConfigured()) {
      const success = await deleteTestimonialFromSupabase(id);
      if (success) {
        setTestimonials(testimonials.filter(t => t.id !== id));
        toast.success("Testimonio eliminado");
      } else {
        toast.error("Error al eliminar");
      }
    }
  };

  if (loading || !profile) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Imágenes</span>
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4" />
            <span className="hidden sm:inline">Testimonios</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Tema</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card className="shadow-elegant border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <User className="w-5 h-5" />
                Información del Perfil
              </CardTitle>
              <CardDescription>
                Edita tu nombre, descripción, bio y etiquetas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Tu nombre o marca"
                    className="border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    placeholder="Content Creator, Influencer, etc."
                    className="border-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Describe tu contenido y lo que ofreces..."
                  className="border-primary/20 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Bio del Hero (texto que aparece en la portada)</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Texto enfocado en valor para las marcas..."
                  className="border-primary/20 min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Este texto aparece en la sección principal del Media Kit. Enfócate en el valor que ofreces a las marcas.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Etiquetas / Nichos</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Añadir etiqueta..."
                    className="border-primary/20"
                  />
                  <Button onClick={addTag} variant="outline" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="shadow-elegant border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <LinkIcon className="w-5 h-5" />
                Redes Sociales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4" /> Instagram
                  </Label>
                  <Input
                    value={profile.socialLinks.instagram}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      socialLinks: { ...profile.socialLinks, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/..."
                    className="border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </Label>
                  <Input
                    value={profile.socialLinks.tiktok}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      socialLinks: { ...profile.socialLinks, tiktok: e.target.value }
                    })}
                    placeholder="https://tiktok.com/@..."
                    className="border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="w-4 h-4" /> Facebook
                  </Label>
                  <Input
                    value={profile.socialLinks.facebook || ""}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      socialLinks: { ...profile.socialLinks, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/..."
                    className="border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    value={profile.socialLinks.email}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      socialLinks: { ...profile.socialLinks, email: e.target.value }
                    })}
                    placeholder="correo@ejemplo.com"
                    className="border-primary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Formats Editor */}
          <WorkFormatsEditor />

          <Button onClick={handleSaveProfile} className="gradient-primary text-primary-foreground w-full">
            <Save className="w-4 h-4 mr-2" />
            Guardar Información
          </Button>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card className="shadow-elegant border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Image className="w-5 h-5" />
                Imágenes del Perfil
              </CardTitle>
              <CardDescription>
                Sube imágenes directamente o pega URLs externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image Uploader */}
              <div className="space-y-3">
                <ImageUploader
                  label="Foto de Perfil"
                  value={profile.profileImageUrl}
                  onChange={(url) => setProfile({ ...profile, profileImageUrl: url })}
                  bucket="media"
                  folder="profile"
                  previewClassName="w-32 h-32 rounded-full"
                  aspectRatio="square"
                  helpText="Tu foto principal que aparece en el hero del Media Kit"
                />
                <StorageImagePicker
                  label="Elegir de galería"
                  value={profile.profileImageUrl}
                  onChange={(url) => setProfile({ ...profile, profileImageUrl: url })}
                  bucket="media"
                  folder="profile"
                />
              </div>

              {/* Logo Uploader */}
              <div className="space-y-3">
                <ImageUploader
                  label="Logo (opcional)"
                  value={profile.logoUrl}
                  onChange={(url) => setProfile({ ...profile, logoUrl: url })}
                  bucket="media"
                  folder="logos"
                  previewClassName="w-32 h-16"
                  aspectRatio="wide"
                  helpText="Logo personalizado para el navbar y footer. Deja vacío para usar el logo SVG por defecto."
                />
                <StorageImagePicker
                  label="Elegir logo de galería"
                  value={profile.logoUrl}
                  onChange={(url) => setProfile({ ...profile, logoUrl: url })}
                  bucket="media"
                  folder="logos"
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveProfile} className="gradient-primary text-primary-foreground w-full">
            <Save className="w-4 h-4 mr-2" />
            Guardar Imágenes
          </Button>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card className="shadow-elegant border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <MessageSquareQuote className="w-5 h-5" />
                Testimonios de Marcas
              </CardTitle>
              <CardDescription>
                Añade testimonios de colaboraciones pasadas para generar confianza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Testimonial Form */}
              <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-4">
                <h4 className="font-medium text-primary">Añadir Nuevo Testimonio</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Cita / Testimonio</Label>
                    <Textarea
                      value={newTestimonial.quote}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                      placeholder="La capacidad de conectar con su audiencia es única..."
                      className="border-primary/20 min-h-[80px]"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cargo / Rol</Label>
                      <Input
                        value={newTestimonial.brand}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, brand: e.target.value })}
                        placeholder="Director de Marketing"
                        className="border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa / Marca</Label>
                      <Input
                        value={newTestimonial.company}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                        placeholder="Marca de Lifestyle"
                        className="border-primary/20"
                      />
                    </div>
                  </div>
                  
                  {/* Image Section */}
                  <div className="space-y-3 p-3 bg-card/50 rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Imagen (opcional)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={newTestimonial.image_type === 'logo' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewTestimonial({ ...newTestimonial, image_type: 'logo' })}
                          className="text-xs"
                        >
                          Logo
                        </Button>
                        <Button
                          type="button"
                          variant={newTestimonial.image_type === 'photo' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewTestimonial({ ...newTestimonial, image_type: 'photo' })}
                          className="text-xs"
                        >
                          Foto
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={newTestimonial.image_url}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, image_url: e.target.value })}
                      placeholder={newTestimonial.image_type === 'logo' ? "URL del logo de la empresa" : "URL de la foto de la persona"}
                      className="border-primary/20"
                    />
                    {newTestimonial.image_url && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={newTestimonial.image_url} 
                          alt="Preview" 
                          className={`w-10 h-10 object-${newTestimonial.image_type === 'logo' ? 'contain' : 'cover'} ${newTestimonial.image_type === 'logo' ? 'rounded-md' : 'rounded-full'} bg-muted`}
                        />
                        <span className="text-xs text-muted-foreground">Vista previa</span>
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={handleAddTestimonial} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Testimonio
                  </Button>
                </div>
              </div>

              {/* Existing Testimonials List */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Testimonios Actuales ({testimonials.length})</h4>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Cargando...</p>
                ) : testimonials.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay testimonios aún. ¡Añade el primero!</p>
                ) : (
                  <div className="space-y-3">
                    {testimonials.map((testimonial) => (
                      <div 
                        key={testimonial.id} 
                        className="p-4 bg-card border border-border rounded-lg flex justify-between items-start gap-4"
                      >
                        <div className="flex gap-3">
                          {testimonial.image_url ? (
                            <img 
                              src={testimonial.image_url} 
                              alt={testimonial.company}
                              className={`w-10 h-10 shrink-0 object-${testimonial.image_type === 'logo' ? 'contain' : 'cover'} ${testimonial.image_type === 'logo' ? 'rounded-md' : 'rounded-full'} bg-muted`}
                            />
                          ) : (
                            <div className="w-10 h-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-foreground/80 italic text-sm mb-2">
                              "{testimonial.quote}"
                            </p>
                            <p className="text-sm font-medium text-primary">{testimonial.brand}</p>
                            <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab - Now uses dedicated ThemeEditor component */}
        <TabsContent value="theme" className="space-y-6">
          <ThemeEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileEditor;