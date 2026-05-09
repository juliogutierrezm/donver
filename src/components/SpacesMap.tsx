import { useEffect, useMemo, useRef } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Space } from "@/types";
import { SpaceMarker } from "@/components/SpaceMarker";
import "@/styles/MapStyles.css";

const COSTA_RICA_CENTER: [number, number] = [9.7489, -83.7534];

interface SpacesMapProps {
  spaces: Space[];
  userLocation: { lat: number; lon: number } | null;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  resultCount: number;
  viewMode: string;
}

function hasValidCoordinates(space: Space) {
  return (
    Number.isFinite(space.latitude) &&
    Number.isFinite(space.longitude) &&
    Math.abs(space.latitude) <= 90 &&
    Math.abs(space.longitude) <= 180
  );
}

function MapResizer({
  viewMode,
  positionKey,
}: {
  viewMode: string;
  positionKey: string;
}) {
  const map = useMap();
  const timeoutRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastObservedSizeRef = useRef("");

  useEffect(() => {
    const scheduleInvalidate = (delay: number) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        map.invalidateSize();
      }, delay);
    };

    scheduleInvalidate(0);
    scheduleInvalidate(150);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [map, positionKey, viewMode]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const container = map.getContainer();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      const nextSizeKey = `${width}x${height}`;

      if (!width || !height || nextSizeKey === lastObservedSizeRef.current) {
        return;
      }

      lastObservedSizeRef.current = nextSizeKey;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
          map.invalidateSize();
        }, 80);
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [map]);

  return null;
}

function MapViewportController({
  userLocation,
  validSpaces,
}: {
  userLocation: { lat: number; lon: number } | null;
  validSpaces: Space[];
}) {
  const map = useMap();

  useEffect(() => {
    if (validSpaces.length === 1) {
      map.setView([validSpaces[0].latitude, validSpaces[0].longitude], 13);
      return;
    }

    if (validSpaces.length > 1) {
      const bounds = L.latLngBounds(
        validSpaces.map((space) => [space.latitude, space.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [48, 48] });
      return;
    }

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 11);
      return;
    }

    map.setView(COSTA_RICA_CENTER, 8);
  }, [map, userLocation?.lat, userLocation?.lon, validSpaces]);

  return null;
}

function MapState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-card p-6 text-center">
      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SpacesMap({
  spaces,
  userLocation,
  searchRadius,
  onRadiusChange,
  resultCount,
  viewMode,
}: SpacesMapProps) {
  const validSpaces = useMemo(
    () => spaces.filter((space) => hasValidCoordinates(space)),
    [spaces]
  );

  const userMarkerIcon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
            <div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
          </div>
        `,
        className: "user-location-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    []
  );

  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : COSTA_RICA_CENTER;
  const positionKey = validSpaces
    .map((space) => `${space.id}:${space.latitude}:${space.longitude}`)
    .join("|");

  if (spaces.length === 0) {
    return (
      <MapState
        title="No se encontraron espacios"
        description="Intenta ajustar tus filtros o buscar en otra ubicación."
      />
    );
  }

  if (validSpaces.length === 0) {
    return (
      <MapState
        title="No hay espacios con ubicación disponible para mostrar en el mapa."
        description="Prueba con otros espacios o revisa si los cuidadores han agregado coordenadas válidas."
      />
    );
  }

  return (
    <div className="relative h-full min-h-[600px] w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <MapResizer viewMode={viewMode} positionKey={positionKey} />
        <MapViewportController userLocation={userLocation} validSpaces={validSpaces} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lon]} icon={userMarkerIcon} />
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

        {validSpaces.map((space) => (
          <SpaceMarker key={space.id} space={space} />
        ))}

        <ZoomControl position="topright" />
      </MapContainer>

      {userLocation && (
        <div className="absolute bottom-6 left-6 z-[400] max-w-xs rounded-lg border border-border bg-card p-4 shadow-soft">
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-foreground">
                Radio de búsqueda
              </label>
              <select
                value={searchRadius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{resultCount}</span>{" "}
                espacios encontrados
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
