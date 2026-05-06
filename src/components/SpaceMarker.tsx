import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { Space } from "@/types";
import { Button } from "@/components/ui/button";

interface SpaceMarkerProps {
  space: Space;
}

function hasValidCoordinates(space: Space) {
  return (
    Number.isFinite(space.latitude) &&
    Number.isFinite(space.longitude) &&
    Math.abs(space.latitude) <= 90 &&
    Math.abs(space.longitude) <= 180
  );
}

export function SpaceMarker({ space }: SpaceMarkerProps) {
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

  const hasCoordinates = hasValidCoordinates(space);
  const mapQuery = hasCoordinates ? `${space.latitude},${space.longitude}` : "";
  const wazeUrl = `https://waze.com/ul?ll=${mapQuery}&navigate=yes`;
  const googleMapsUrl = `https://www.google.com/maps?q=${mapQuery}`;

  return (
    <Marker position={[space.latitude, space.longitude]} icon={markerIcon}>
      <Popup maxWidth={280} className="space-marker-popup">
        <div className="space-y-3 text-sm">
          <div>
            <img
              src={space.photos[0]}
              alt={space.title}
              className="h-40 w-full rounded-lg object-cover"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">{space.title}</h3>
            <p className="text-xs text-muted-foreground">
              {space.canton}, {space.province}
            </p>
            <p className="text-sm font-semibold text-primary">
              Desde ₡{space.pricePerNight.toLocaleString("es-CR")} por noche
            </p>
          </div>
          <Link to={`/spaces/${space.id}`} className="block">
            <Button size="sm" className="w-full text-xs">
              Ver espacio
            </Button>
          </Link>
          {hasCoordinates && (
            <div className="flex gap-2 text-xs">
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md border border-border px-3 py-2 text-center font-medium text-foreground transition-colors hover:bg-accent"
              >
                Abrir en Waze
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md border border-border px-3 py-2 text-center font-medium text-foreground transition-colors hover:bg-accent"
              >
                Abrir en Google Maps
              </a>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
