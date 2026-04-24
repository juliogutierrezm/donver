import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import type { Space } from "@/types";
import { SpaceMarker } from "@/components/SpaceMarker";
import "@/styles/MapStyles.css";

interface SpacesMapProps {
  spaces: Space[];
  userLocation: { lat: number; lon: number } | null;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  resultCount: number;
}

export function SpacesMap({
  spaces,
  userLocation,
  searchRadius,
  onRadiusChange,
  resultCount,
}: SpacesMapProps) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : [9.7489, -83.7534]; // Center of Costa Rica

  // User location marker with ping animation
  const userMarkerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
        <div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
      </div>
    `,
    className: "user-location-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div className="relative h-full w-full rounded-lg border border-border overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={userMarkerIcon}
            />
            {/* Search radius circle */}
            <Circle
              center={[userLocation.lat, userLocation.lon]}
              radius={searchRadius * 1000}
              pathOptions={{
                color: "hsl(142 71% 45%)",
                fillColor: "hsl(142 71% 45%)",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          </>
        )}

        {/* Space markers */}
        {spaces.map((space) => (
          <SpaceMarker key={space.id} space={space} />
        ))}

        <ZoomControl position="topright" />
      </MapContainer>

      {/* Floating radius selector */}
      {userLocation && (
        <div className="absolute bottom-6 left-6 bg-card border border-border rounded-lg shadow-soft p-4 z-40 max-w-xs">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">
                Radio de búsqueda
              </label>
              <select
                value={searchRadius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {resultCount}
                </span>{" "}
                espacios encontrados
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
