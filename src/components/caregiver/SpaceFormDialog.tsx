import { useState, useEffect } from "react";
import { PET_TYPES, AMENITIES } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/PhotoUpload";
import type { Space } from "@/types";

interface SpaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (spaceData: Partial<Space>) => void;
  space?: Space;
}

export function SpaceFormDialog({
  open,
  onOpenChange,
  onSave,
  space,
}: SpaceFormDialogProps) {
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerNight: 45000,
    pricePerHour: 12000,
    minHours: 2,
    maxPets: 3,
    acceptedPetTypes: [] as string[],
    amenities: [] as string[],
    photos: [] as string[],
  });

  useEffect(() => {
    if (space) {
      setFormData({
        title: space.title,
        description: space.description,
        pricePerNight: space.pricePerNight,
        pricePerHour: space.pricePerHour,
        minHours: space.minHours,
        maxPets: space.maxPets,
        acceptedPetTypes: space.acceptedPetTypes,
        amenities: space.amenities,
        photos: space.photos,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        pricePerNight: 45000,
        pricePerHour: 12000,
        minHours: 2,
        maxPets: 3,
        acceptedPetTypes: [],
        amenities: [],
        photos: [],
      });
    }
  }, [space, open]);

  const togglePetType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      acceptedPetTypes: prev.acceptedPetTypes.includes(type)
        ? prev.acceptedPetTypes.filter((t) => t !== type)
        : [...prev.acceptedPetTypes, type],
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSave = () => {
    if (isUploadingPhotos) {
      return;
    }

    if (formData.title && formData.description) {
      onSave({
        ...formData,
        acceptedPetTypes: formData.acceptedPetTypes as import("@/types").PetType[],
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {space ? "Editar Espacio" : "Nuevo Espacio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photos */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Fotos del espacio (máx. 4)
            </label>
            <PhotoUpload
              photos={formData.photos}
              onPhotosChange={(photos) =>
                setFormData((prev) => ({ ...prev, photos: photos.slice(0, 4) }))
              }
              maxPhotos={4}
              uploadKind="space"
              onBusyChange={setIsUploadingPhotos}
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Nombre del espacio
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ej: Casa con Jardín Amplio"
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe tu espacio, características, amenidades..."
              rows={4}
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Por noche (CRC)
              </label>
              <input
                type="number"
                value={formData.pricePerNight}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricePerNight: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Por hora (CRC)
              </label>
              <input
                type="number"
                value={formData.pricePerHour}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricePerHour: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Min Hours & Max Pets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Mínimo de horas
              </label>
              <input
                type="number"
                value={formData.minHours}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minHours: parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Máximo de mascotas
              </label>
              <input
                type="number"
                value={formData.maxPets}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxPets: parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Pet Types */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Tipos de mascotas aceptadas
            </label>
            <div className="space-y-2">
              {PET_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedPetTypes.includes(type)}
                    onChange={() => togglePetType(type)}
                    className="w-4 h-4 rounded border-input cursor-pointer"
                  />
                  <span className="text-sm text-foreground">
                    {type === "dog"
                      ? "🐕 Perros"
                      : type === "cat"
                        ? "🐱 Gatos"
                        : type === "bird"
                          ? "🦜 Aves"
                          : "🐾 Otros"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Amenidades
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="w-4 h-4 rounded border-input cursor-pointer"
                  />
                  <span className="text-xs text-foreground capitalize">
                    {amenity.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUploadingPhotos}>
            {space ? "Guardar cambios" : "Crear espacio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
