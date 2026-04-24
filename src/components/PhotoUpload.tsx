import { useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { uploadApi } from "@/services/api";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  uploadKind?: "space" | "pet";
  onBusyChange?: (busy: boolean) => void;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  uploadKind = "space",
  onBusyChange,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [pendingPreviews]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleFiles = async (files: FileList) => {
    if (isUploading) return;

    const availableSlots = Math.max(maxPhotos - photos.length, 0);
    const selectedFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots);

    if (selectedFiles.length === 0) {
      return;
    }

    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPendingPreviews((current) => [...current, ...previews]);
    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadedPhotos = await Promise.all(
        selectedFiles.map(async (file) => {
          const result =
            uploadKind === "pet"
              ? await uploadApi.uploadPetFile(file)
              : await uploadApi.uploadSpaceFile(file);
          return result.url;
        })
      );

      onPhotosChange([...photos, ...uploadedPhotos].slice(0, maxPhotos));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "No se pudieron subir las fotos."
      );
    } finally {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setPendingPreviews((current) => current.filter((preview) => !previews.includes(preview)));
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    if (isUploading) return;
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border bg-muted/50"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="photo-input"
          disabled={isUploading || photos.length >= maxPhotos}
        />
        <label
          htmlFor="photo-input"
          className={`cursor-pointer ${isUploading || photos.length >= maxPhotos ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
            <p className="font-semibold text-foreground">
              {isUploading ? "Subiendo fotos..." : "Arrastra fotos aquí o haz click"}
            </p>
            <p className="text-xs text-muted-foreground">
              {photos.length}/{maxPhotos} fotos
            </p>
          </div>
        </label>
      </div>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {/* Photo Grid */}
      {(photos.length > 0 || pendingPreviews.length > 0) && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          ))}

          {pendingPreviews.map((preview, index) => (
            <div
              key={`${preview}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={preview}
                alt={`Pending photo ${index + 1}`}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
