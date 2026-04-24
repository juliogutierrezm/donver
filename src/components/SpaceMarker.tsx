import { Marker, Popup } from "react-leaflet";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import type { Space } from "@/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SpaceMarkerProps {
  space: Space;
}

export function SpaceMarker({ space }: SpaceMarkerProps) {
  // Create custom marker icon with price
  const markerHtml = `
    <div class="flex flex-col items-center">
      <div class="bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
        ₡${space.pricePerHour.toLocaleString("es-CR")}/h
      </div>
      <div class="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary"></div>
    </div>
  `;

  const markerIcon = L.divIcon({
    html: markerHtml,
    className: "custom-marker",
    iconSize: [60, 40],
    iconAnchor: [30, 40],
    popupAnchor: [0, -40],
  });

  return (
    <Marker position={[space.latitude, space.longitude]} icon={markerIcon}>
      <Popup maxWidth={280} className="space-marker-popup">
        <div className="space-y-3 text-sm">
          <div>
            <img
              src={space.photos[0]}
              alt={space.title}
              className="w-full h-40 object-cover rounded-lg"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{space.title}</h3>
            <p className="text-xs text-muted-foreground">
              {space.canton}, {space.province}
            </p>
          </div>
          <div className="flex gap-2 justify-between text-xs">
            <div>
              <p className="text-muted-foreground">Por noche</p>
              <p className="font-semibold text-primary">
                ₡{space.pricePerNight.toLocaleString("es-CR")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Por hora</p>
              <p className="font-semibold text-primary">
                ₡{space.pricePerHour.toLocaleString("es-CR")}
              </p>
            </div>
          </div>
          <Link to={`/spaces/${space.id}`} className="block">
            <Button size="sm" className="w-full text-xs">
              Ver detalles
            </Button>
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
