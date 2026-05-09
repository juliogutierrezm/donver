import { useEffect, useMemo, useState } from "react";
import { AMENITIES, CANTONES, PET_SIZES, PET_TYPES, PROVINCES, type Province } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/LocationPicker";
import { PhotoUpload } from "@/components/PhotoUpload";
import { useToast } from "@/hooks/use-toast";
import { getPetSizeLabel, getPetTypeIcon, getPetTypeLabel } from "@/lib/pet-labels";
import type { Space } from "@/types";

interface SpaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (spaceData: Partial<Space>) => void;
  space?: Space;
  caregiverDefaults?: {
    province?: Province;
    canton?: string;
  };
}

const DEFAULT_COORDINATES_BY_PROVINCE: Record<Province, { latitude: number; longitude: number }> = {
  "San José": { latitude: 9.9281, longitude: -84.0907 },
  Alajuela: { latitude: 10.0163, longitude: -84.2116 },
  Cartago: { latitude: 9.8644, longitude: -83.9194 },
  Heredia: { latitude: 9.9986, longitude: -84.1165 },
  Guanacaste: { latitude: 10.6346, longitude: -85.4400 },
  Puntarenas: { latitude: 9.9763, longitude: -84.8384 },
  Limón: { latitude: 9.9907, longitude: -83.0350 },
};

function createDefaultForm(
  space?: Space,
  caregiverDefaults?: SpaceFormDialogProps["caregiverDefaults"]
) {
  const defaultProvince = space?.province ?? caregiverDefaults?.province ?? "San José";
  const defaultCoordinates = DEFAULT_COORDINATES_BY_PROVINCE[defaultProvince];

  return {
    title: space?.title ?? "",
    description: space?.description ?? "",
    province: defaultProvince,
    canton: space?.canton ?? caregiverDefaults?.canton ?? "",
    district: space?.district ?? "",
    address: space?.address ?? "",
    formattedAddress: space?.formattedAddress ?? space?.address ?? "",
    latitude: space?.latitude ?? defaultCoordinates.latitude,
    longitude: space?.longitude ?? defaultCoordinates.longitude,
    pricePerNight: space?.pricePerNight ?? 45000,
    pricePerHour: space?.pricePerHour ?? 12000,
    minHours: space?.minHours ?? 2,
    maxPets: space?.maxPets ?? 3,
    acceptedPetTypes: space?.acceptedPetTypes ?? ([] as string[]),
    acceptedPetSizes: space?.acceptedPetSizes ?? ([] as string[]),
    amenities: space?.amenities ?? ([] as string[]),
    photos: space?.photos ?? ([] as string[]),
    isActive: space?.isActive ?? false,
  };
}

export function SpaceFormDialog({
  open,
  onOpenChange,
  onSave,
  space,
  caregiverDefaults,
}: SpaceFormDialogProps) {
  const { toast } = useToast();
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState(createDefaultForm(space, caregiverDefaults));

  const isProvinceOption = (value?: string): value is Province =>
    Boolean(value && PROVINCES.includes(value as Province));

  useEffect(() => {
    if (open) {
      setFormData(createDefaultForm(space, caregiverDefaults));
      setIsUploadingPhotos(false);
    }
  }, [caregiverDefaults, open, space]);

  const availableCantons = useMemo(() => {
    if (!formData.province) return [];
    return CANTONES[formData.province as keyof typeof CANTONES] || [];
  }, [formData.province]);

  useEffect(() => {
    if (formData.province && formData.canton && !availableCantons.includes(formData.canton)) {
      setFormData((prev) => ({ ...prev, canton: "" }));
    }
  }, [availableCantons, formData.canton, formData.province]);

  const toggleListValue = (field: "acceptedPetTypes" | "acceptedPetSizes" | "amenities", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSave = () => {
    if (isUploadingPhotos) return;
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Completa la información básica",
        description: "Agrega un nombre y una descripción antes de guardar el espacio.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.province || !formData.canton || !formData.address.trim()) {
      toast({
        title: "Completa la ubicación",
        description: "Selecciona la ubicación en el mapa o buscador y confirma provincia, cantón y dirección visible.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(formData.latitude) || !Number.isFinite(formData.longitude)) {
      toast({
        title: "Ubicación inválida",
        description: "No pudimos guardar las coordenadas. Intenta marcar la ubicación nuevamente.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      title: formData.title,
      description: formData.description,
      province: formData.province,
      canton: formData.canton,
      district: formData.district || undefined,
      address: formData.address,
      formattedAddress: formData.formattedAddress || formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      pricePerNight: formData.pricePerNight,
      pricePerHour: formData.pricePerHour,
      minHours: formData.minHours,
      maxPets: formData.maxPets,
      acceptedPetTypes: formData.acceptedPetTypes as Space["acceptedPetTypes"],
      acceptedPetSizes: formData.acceptedPetSizes as Space["acceptedPetSizes"],
      amenities: formData.amenities,
      photos: formData.photos,
      isActive: formData.isActive,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{space ? "Editar espacio" : "Nuevo espacio"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-6 py-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Los espacios nuevos se guardan como borrador. Solo podrás publicarlos cuando tu perfil de cuidador esté completo y el espacio tenga todos sus datos obligatorios.
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Fotos del espacio
            </label>
            <PhotoUpload
              photos={formData.photos}
              onPhotosChange={(photos) => setFormData((prev) => ({ ...prev, photos: photos.slice(0, 6) }))}
              maxPhotos={6}
              uploadKind="space"
              onBusyChange={setIsUploadingPhotos}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Nombre del espacio
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Provincia
              </label>
              <select
                value={formData.province}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    province: event.target.value as Space["province"],
                    canton: "",
                  }))
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Cantón
              </label>
              <select
                value={formData.canton}
                onChange={(event) => setFormData((prev) => ({ ...prev, canton: event.target.value }))}
                disabled={!formData.province}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Selecciona</option>
                {availableCantons.map((canton) => (
                  <option key={canton} value={canton}>
                    {canton}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Dirección visible
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: event.target.value,
                    formattedAddress: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Ubicación
            </label>
            <LocationPicker
              coordinates={{ lat: formData.latitude, lng: formData.longitude }}
              onLocationChange={(location) =>
                setFormData((prev) => ({
                  ...prev,
                  latitude: location.coords.lat,
                  longitude: location.coords.lng,
                  address: location.formattedAddress,
                  formattedAddress: location.formattedAddress,
                  province: isProvinceOption(location.province) ? location.province : prev.province,
                  canton: location.canton ?? prev.canton,
                  district: location.district ?? prev.district,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Precio por noche (CRC)
              </label>
              <input
                type="number"
                value={formData.pricePerNight}
                onChange={(event) => setFormData((prev) => ({ ...prev, pricePerNight: Number(event.target.value) || 0 }))}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Precio por hora (CRC)
              </label>
              <input
                type="number"
                value={formData.pricePerHour}
                onChange={(event) => setFormData((prev) => ({ ...prev, pricePerHour: Number(event.target.value) || 0 }))}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Mínimo de horas
              </label>
              <input
                type="number"
                value={formData.minHours}
                min="1"
                onChange={(event) => setFormData((prev) => ({ ...prev, minHours: Number(event.target.value) || 1 }))}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Máximo de mascotas
              </label>
              <input
                type="number"
                value={formData.maxPets}
                min="1"
                onChange={(event) => setFormData((prev) => ({ ...prev, maxPets: Number(event.target.value) || 1 }))}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Tipos de mascotas aceptadas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PET_TYPES.map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.acceptedPetTypes.includes(type)}
                    onChange={() => toggleListValue("acceptedPetTypes", type)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm text-foreground">
                    {getPetTypeIcon(type)} {getPetTypeLabel(type)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Tamaños aceptados
            </label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {PET_SIZES.map((size) => (
                <label key={size} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.acceptedPetSizes.includes(size)}
                    onChange={() => toggleListValue("acceptedPetSizes", size)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm text-foreground">{getPetSizeLabel(size)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Amenidades
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map((amenity) => (
                <label key={amenity} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleListValue("amenities", amenity)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-xs text-foreground">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUploadingPhotos}>
            {space ? "Guardar cambios" : "Guardar borrador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
