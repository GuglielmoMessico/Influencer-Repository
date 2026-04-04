import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Video, Trash2, Plus, Play, ExternalLink, Loader2, Image as ImageIcon } from "lucide-react";
import { useHeroVideos } from "@/hooks/use-data";
import { toast } from "sonner";

const HeroVideosManager = () => {
  const { videos, loading, addVideo, removeVideo, toggleVideoActive } = useHeroVideos();
  const [newVideo, setNewVideo] = useState({
    video_url: "",
    thumbnail_url: "",
    title: ""
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newVideo.video_url) {
      toast.error("La URL del video es obligatoria");
      return;
    }
    
    setIsAdding(true);
    const success = await addVideo({
      ...newVideo,
      is_active: videos.length === 0 // Active by default if it's the first one
    });
    
    if (success) {
      toast.success("Video añadido correctamente");
      setNewVideo({ video_url: "", thumbnail_url: "", title: "" });
    } else {
      toast.error("Error al añadir el video");
    }
    setIsAdding(false);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando videos del banner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Añadir Nuevo Video al Banner
          </CardTitle>
          <CardDescription>
            Configura videos de fondo o promocionales para la página de inicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_url">URL del Video (MP4/Direct Link)</Label>
              <div className="relative">
                <Video className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="video_url"
                  placeholder="https://ejemplo.com/video.mp4"
                  className="pl-10 border-primary/20 focus-visible:ring-primary"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título del Video (Opcional)</Label>
              <Input
                id="title"
                placeholder="Ej: Promo Verano 2024"
                className="border-primary/20 focus-visible:ring-primary"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="thumbnail_url">URL de Miniatura (Opcional - Imagen de respaldo)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="thumbnail_url"
                  placeholder="https://ejemplo.com/poster.jpg"
                  className="pl-10 border-primary/20 focus-visible:ring-primary"
                  value={newVideo.thumbnail_url}
                  onChange={(e) => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })}
                />
              </div>
            </div>
          </div>
          <Button 
            className="w-full gradient-primary text-primary-foreground font-bold"
            onClick={handleAdd}
            disabled={isAdding}
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Añadir al Banner
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {videos.map((video) => (
            <motion.div
              key={video.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`overflow-hidden border-primary/10 transition-all ${video.is_active ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background' : 'opacity-80'}`}>
                <div className="aspect-video relative group bg-black">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title || "Video"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                      <Video className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="rounded-full" asChild>
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                  {video.is_active && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-full font-bold shadow-lg">
                      ACTIVA
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm truncate">{video.title || "Sin título"}</h3>
                    <Switch 
                      checked={video.is_active} 
                      onCheckedChange={() => toggleVideoActive(video.id, !video.is_active)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{video.video_url}</p>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => {
                        if (confirm('¿Eliminar este video del banner?')) {
                          removeVideo(video.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Eliminar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8"
                      asChild
                    >
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Link
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {videos.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-12 text-center border-2 border-dashed border-primary/10 rounded-xl">
            <Video className="w-12 h-12 mx-auto text-primary/20 mb-3" />
            <p className="text-muted-foreground">No hay videos configurados para el banner.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroVideosManager;
