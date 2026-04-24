import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/LocationPicker";
import { PROVINCES, CANTONES } from "@/types";

interface CaregiverStepTwoProps {
  formData: {
    province: string;
    canton: string;
    locationName: string;
    coordinates: { lat: number; lng: number } | null;
  };
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export function CaregiverStepTwo({
  formData,
  onChange,
  onBack,
  onNext,
}: CaregiverStepTwoProps) {
  const availableCantons = useMemo(() => {
    if (!formData.province) return [];
    return CANTONES[formData.province as keyof typeof CANTONES] || [];
  }, [formData.province]);

  useEffect(() => {
    if (formData.province && formData.canton && !availableCantons.includes(formData.canton)) {
      onChange("canton", "");
    }
  }, [availableCantons, formData.canton, formData.province, onChange]);

  const isComplete = formData.province && formData.canton && formData.coordinates;

  const handleLocationChange = (
    coords: { lat: number; lng: number },
    address: string
  ) => {
    onChange("coordinates", coords);
    onChange("locationName", address);
  };

  return (
    <div className="space-y-6">
      {/* Province / Canton selects */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-1 block">
            Provincia
          </label>
          <select
            value={formData.province}
            onChange={(e) => onChange("province", e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecciona</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-1 block">
            Cantón
          </label>
          <select
            value={formData.canton}
            onChange={(e) => onChange("canton", e.target.value)}
            disabled={!formData.province}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">Selecciona</option>
            {availableCantons.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Location picker with map */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Ubicación exacta en el mapa
        </label>
        <LocationPicker
          coordinates={formData.coordinates}
          onLocationChange={handleLocationChange}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!isComplete} className="flex-1">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
