import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Loader2, FolderOpen } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { toast } from "sonner";

interface StorageFile {
  name: string;
  url: string;
}

interface StorageImagePickerProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  bucket: 'media' | 'campaigns';
  folder?: string;
}

const StorageImagePicker = ({ 
  label = "Seleccionar imagen", 
  value, 
  onChange, 
  bucket, 
  folder 
}: StorageImagePickerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);

  const loadFiles = async () => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase no está configurado");
      return;
    }

    setLoading(true);
    const client = getSupabaseClient();
    
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const path = folder || '';
      const { data, error } = await client.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error listing files:', error);
        toast.error('Error al cargar archivos');
        setLoading(false);
        return;
      }

      // Filter only image files and get public URLs
      const imageFiles = (data || [])
        .filter(file => !file.id?.startsWith('.') && file.name && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name))
        .map(file => {
          const filePath = folder ? `${folder}/${file.name}` : file.name;
          const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
          return {
            name: file.name,
            url: urlData.publicUrl
          };
        });

      setFiles(imageFiles);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al cargar archivos');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open]);

  const handleSelect = (url: string) => {
    onChange(url);
    setOpen(false);
    toast.success("Imagen seleccionada");
  };

  if (!isSupabaseConfigured()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <FolderOpen className="w-4 h-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Seleccionar imagen de la galería
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay imágenes en esta galería</p>
            <p className="text-sm mt-2">Sube imágenes primero usando el uploader</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-2">
              {files.map((file) => (
                <button
                  key={file.url}
                  onClick={() => handleSelect(file.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    value === file.url 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {value === file.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StorageImagePicker;
