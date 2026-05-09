import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/PhotoUpload";
import { getPetSizeHelp, getPetSizeLabel, getPetTypeSingularLabel } from "@/lib/pet-labels";
import { parseIntegerInput, sanitizeIntegerInput } from "@/lib/numeric-input";
import { PET_TYPES, PET_SIZES } from "@/types";
import type { Pet } from "@/types";

interface PetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pet: Partial<Pet>) => void | Promise<void>;
  pet?: Pet;
}

function createDefaultPetForm(pet?: Pet): Partial<Pet> {
  return (
    pet || {
      name: "",
      type: "dog",
      breed: "",
      age: 1,
      size: "medium",
      description: "",
      photos: [],
      specialNeeds: "",
    }
  );
}

export function PetFormDialog({
  open,
  onOpenChange,
  onSave,
  pet,
}: PetFormDialogProps) {
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Pet>>(createDefaultPetForm(pet));
  const [ageInput, setAgeInput] = useState(() => String(createDefaultPetForm(pet).age ?? 1));

  useEffect(() => {
    if (open) {
      const nextForm = createDefaultPetForm(pet);
      setFormData(nextForm);
      setAgeInput(String(nextForm.age ?? 1));
      setIsUploadingPhotos(false);
      setIsSubmitting(false);
    }
  }, [open, pet]);

  const handleSubmit = async () => {
    if (isUploadingPhotos || isSubmitting) {
      return;
    }

    if (!formData.name) {
      alert("Por favor ingresa el nombre de tu mascota");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] min-h-0 max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>
            {pet ? "Editar mascota" : "Agregar mascota"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-4">
          {/* Photos */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Fotos
            </label>
            <PhotoUpload
              photos={formData.photos || []}
              onPhotosChange={(photos) =>
                setFormData({ ...formData, photos })
              }
              maxPhotos={5}
              uploadKind="pet"
              onBusyChange={setIsUploadingPhotos}
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Luna"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Tipo
              </label>
              <select
                value={formData.type || "dog"}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as Pet["type"] })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getPetTypeSingularLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Raza
              </label>
              <input
                type="text"
                value={formData.breed || ""}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
                placeholder="Ej: Golden Retriever"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Edad (años)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={ageInput}
                onChange={(e) => {
                  const nextValue = sanitizeIntegerInput(e.target.value);
                  setAgeInput(nextValue);
                  setFormData({ ...formData, age: parseIntegerInput(nextValue, 0) });
                }}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Tamaño
              </label>
              <select
                value={formData.size || "medium"}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value as Pet["size"] })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PET_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {getPetSizeLabel(size)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                {getPetSizeHelp((formData.size as Pet["size"]) || "medium")}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Descripción
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Cuéntanos sobre tu mascota..."
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
            />
          </div>

          {/* Special Needs */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Necesidades especiales
            </label>
            <input
              type="text"
              value={formData.specialNeeds || ""}
              onChange={(e) =>
                setFormData({ ...formData, specialNeeds: e.target.value })
              }
              placeholder="Ej: Sensible al calor, requiere medicamento"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isUploadingPhotos || isSubmitting}
          >
            {isSubmitting
              ? "Guardando..."
              : pet
                ? "Guardar cambios"
                : "Agregar mascota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
