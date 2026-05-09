import { PET_TYPES, PET_SIZES, AMENITIES } from "@/types";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/PhotoUpload";
import { getPetSizeLabel, getPetTypeIcon, getPetTypeLabel } from "@/lib/pet-labels";
import { parseIntegerInput, sanitizeIntegerInput } from "@/lib/numeric-input";
import { useEffect, useState } from "react";

interface CaregiverStepThreeProps {
  formData: {
    spaceTitle: string;
    spaceDescription: string;
    pricePerNight: number;
    pricePerHour: number;
    minHours: number;
    acceptedPetTypes: string[];
    acceptedPetSizes: string[];
    maxPets: number;
    amenities: string[];
    photos: string[];
  };
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function CaregiverStepThree({
  formData,
  onChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}: CaregiverStepThreeProps) {
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [numericInputs, setNumericInputs] = useState({
    pricePerNight: String(formData.pricePerNight),
    pricePerHour: String(formData.pricePerHour),
    minHours: String(formData.minHours),
    maxPets: String(formData.maxPets),
  });

  useEffect(() => {
    setNumericInputs({
      pricePerNight: String(formData.pricePerNight),
      pricePerHour: String(formData.pricePerHour),
      minHours: String(formData.minHours),
      maxPets: String(formData.maxPets),
    });
  }, [formData.maxPets, formData.minHours, formData.pricePerHour, formData.pricePerNight]);
  const toggleItem = (field: string, list: string[], item: string) => {
    const updated = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    onChange(field, updated);
  };

  const isComplete =
    formData.spaceTitle &&
    formData.spaceDescription &&
    formData.acceptedPetTypes.length > 0 &&
    formData.pricePerNight > 0 &&
    formData.pricePerHour > 0;

  return (
    <div className="space-y-6">
      {/* Photos */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Fotos del espacio
        </label>
        <PhotoUpload
          photos={formData.photos}
          onPhotosChange={(photos) => onChange("photos", photos.slice(0, 6))}
          maxPhotos={6}
          uploadKind="space"
          onBusyChange={setIsUploadingPhotos}
        />
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Nombre del espacio *
        </label>
        <input
          type="text"
          value={formData.spaceTitle}
          onChange={(e) => onChange("spaceTitle", e.target.value)}
          placeholder="Ej: Casa con Jardín Amplio"
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Descripción *
        </label>
        <textarea
          value={formData.spaceDescription}
          onChange={(e) => onChange("spaceDescription", e.target.value)}
          placeholder="Describe tu espacio, amenidades, características especiales..."
          rows={3}
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-1 block">
            Precio por noche (₡) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numericInputs.pricePerNight}
            onChange={(e) => {
              const nextValue = sanitizeIntegerInput(e.target.value);
              setNumericInputs((current) => ({ ...current, pricePerNight: nextValue }));
              onChange("pricePerNight", parseIntegerInput(nextValue, 0));
            }}
            placeholder="45000"
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-1 block">
            Precio por hora (₡) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numericInputs.pricePerHour}
            onChange={(e) => {
              const nextValue = sanitizeIntegerInput(e.target.value);
              setNumericInputs((current) => ({ ...current, pricePerHour: nextValue }));
              onChange("pricePerHour", parseIntegerInput(nextValue, 0));
            }}
            placeholder="8000"
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Min hours & max pets */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-1 block">
            Mínimo de horas
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numericInputs.minHours}
            onChange={(e) => {
              const nextValue = sanitizeIntegerInput(e.target.value);
              setNumericInputs((current) => ({ ...current, minHours: nextValue }));
              onChange("minHours", parseIntegerInput(nextValue, 1));
            }}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-1 block">
            Máximo de mascotas
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numericInputs.maxPets}
            onChange={(e) => {
              const nextValue = sanitizeIntegerInput(e.target.value);
              setNumericInputs((current) => ({ ...current, maxPets: nextValue }));
              onChange("maxPets", parseIntegerInput(nextValue, 1));
            }}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Accepted pet types */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Tipos de mascotas aceptadas *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PET_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptedPetTypes.includes(type)}
                onChange={() => toggleItem("acceptedPetTypes", formData.acceptedPetTypes, type)}
                className="w-4 h-4 rounded border-input cursor-pointer"
              />
              <span className="text-sm text-foreground">
                {getPetTypeIcon(type)} {getPetTypeLabel(type)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Accepted pet sizes */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Tamaños aceptados
        </label>
        <div className="space-y-2">
          {PET_SIZES.map((size) => (
            <label key={size} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptedPetSizes.includes(size)}
                onChange={() => toggleItem("acceptedPetSizes", formData.acceptedPetSizes, size)}
                className="w-4 h-4 rounded border-input cursor-pointer"
              />
              <span className="text-sm text-foreground">{getPetSizeLabel(size)}</span>
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
                onChange={() => toggleItem("amenities", formData.amenities, amenity)}
                className="w-4 h-4 rounded border-input cursor-pointer"
              />
              <span className="text-xs text-foreground">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Atrás
        </Button>
        <Button onClick={onSubmit} disabled={!isComplete || isUploadingPhotos || isSubmitting} className="flex-1">
          {isSubmitting ? "Guardando..." : "Crear Cuenta"}
        </Button>
      </div>
    </div>
  );
}
