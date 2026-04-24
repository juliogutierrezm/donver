import { Check } from "lucide-react";

const amenityIcons: Record<string, string> = {
  "Jardín cercado": "🌳",
  "Aire acondicionado": "❄️",
  "Cámaras de seguridad": "📹",
  "Piscina para mascotas": "🏊",
  "Área de juegos": "🎪",
  "Paseos diarios": "🚶",
  "Alimentación premium": "🍖",
  "Atención veterinaria": "🏥",
  "Servicio 24/7": "⏰",
  "Transporte incluido": "🚗",
};

interface SpaceAmenitiesProps {
  amenities: string[];
}

export function SpaceAmenities({ amenities }: SpaceAmenitiesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
          Amenidades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {amenities.map((amenity) => (
            <div
              key={amenity}
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <span className="text-2xl">
                {amenityIcons[amenity] || "✓"}
              </span>
              <span className="text-foreground font-medium">{amenity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
