import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, type StorageBucket } from "@/lib/supabase-storage";
import { isSupabaseConfigured } from "@/lib/supabase-client";

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket: StorageBucket;
  folder?: string;
  placeholder?: string;
  previewClassName?: string;
  aspectRatio?: "square" | "wide" | "tall";
  helpText?: string;
}

const ImageUploader = ({
  label,
  value,
  onChange,
  bucket,
  folder,
  placeholder = "https://... o sube una imagen",
  previewClassName = "w-24 h-24",
  aspectRatio = "square",
  helpText
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"url" | "upload">("upload");
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    if (!isSupabaseConfigured()) {
      toast.error("Configura Supabase primero para subir imágenes");
      return;
    }

    setUploading(true);
    setPreviewError(false);

    const { url, error } = await uploadFile(bucket, file, folder);

    setUploading(false);

    if (error) {
      toast.error(`Error al subir: ${error}`);
      return;
    }

    if (url) {
      onChange(url);
      toast.success("Imagen subida correctamente");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewError(false);
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
    setPreviewError(false);
  };

  const aspectClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    tall: "aspect-[3/4]"
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("upload")}
            className="h-7 text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            Subir
          </Button>
          <Button
            type="button"
            variant={mode === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("url")}
            className="h-7 text-xs"
          >
            <LinkIcon className="w-3 h-3 mr-1" />
            URL
          </Button>
        </div>
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !isSupabaseConfigured()}
            className="w-full border-dashed border-2 h-20 hover:bg-muted/50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {isSupabaseConfigured() 
                  ? "Seleccionar imagen (max 5MB)" 
                  : "Configura Supabase primero"
                }
              </>
            )}
          </Button>
          {!isSupabaseConfigured() && (
            <p className="text-xs text-muted-foreground">
              Necesitas configurar Supabase para subir imágenes. Usa la pestaña "Supabase" primero.
            </p>
          )}
        </div>
      ) : (
        <Input
          value={value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="border-primary/20"
        />
      )}

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}

      {/* Preview */}
      <div className="flex items-center gap-4">
        <div className={`${previewClassName} ${aspectClasses[aspectRatio]} rounded-lg overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center relative`}>
          {value && !previewError ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewError(true)}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleClear}
                className="absolute top-1 right-1 h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
        </div>
        {value && (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{value}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
