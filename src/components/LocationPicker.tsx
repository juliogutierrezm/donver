import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { AlertCircle, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/LocationSearch";
import L from "leaflet";

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const COSTA_RICA_CENTER: [number, number] = [9.7489, -83.7534];

interface LocationPickerProps {
  coordinates: { lat: number; lng: number } | null;
  onLocationChange: (coords: { lat: number; lng: number }, address: string) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ coords }: { coords: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 1 });
    }
  }, [coords, map]);

  return null;
}

export function LocationPicker({ coordinates, onLocationChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinates) {
      setAddress("");
      return;
    }

    const fallbackAddress = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
    setAddress((currentAddress) => currentAddress || fallbackAddress);
    setFlyTarget([coordinates.lat, coordinates.lng]);
  }, [coordinates]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setMapError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
        { headers: { "Accept-Language": "es" } }
      );
      if (!res.ok) {
        throw new Error("No se pudo resolver la direccion.");
      }
      const data = await res.json();
      const displayName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(displayName);
      onLocationChange({ lat, lng }, displayName);
    } catch {
      const displayName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(displayName);
      onLocationChange({ lat, lng }, displayName);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    await reverseGeocode(lat, lng);
  };

  const handleLocationSearchSelect = (location: {
    lat: number;
    lon: number;
    displayName: string;
  }) => {
    setMapError(null);
    setAddress(location.displayName);
    setFlyTarget([location.lat, location.lon]);
    onLocationChange({ lat: location.lat, lng: location.lon }, location.displayName);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalizacion.");
      return;
    }
    setLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setFlyTarget([latitude, longitude]);
        await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      () => {
        setGeoError("No se pudo obtener tu ubicacion actual.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const center: [number, number] = coordinates
    ? [coordinates.lat, coordinates.lng]
    : COSTA_RICA_CENTER;

  return (
    <div className="space-y-3">
      {/* Address search */}
      <LocationSearch onLocationSelect={handleLocationSearchSelect} value={address} />

      {/* GPS button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUseGPS}
        disabled={loading}
        className="gap-2 w-full"
      >
        <Navigation className="w-4 h-4" />
        {loading ? "Obteniendo ubicación…" : "Usar mi GPS"}
      </Button>

      {/* Interactive map */}
      <div className="h-56 rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={center}
          zoom={coordinates ? 14 : 8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            eventHandlers={{
              tileerror: () => setMapError("No se pudo cargar el mapa correctamente."),
            }}
          />
          <ClickHandler onMapClick={handleMapClick} />
          {flyTarget && <FlyToLocation coords={flyTarget} />}
          {coordinates && (
            <Marker position={[coordinates.lat, coordinates.lng]} />
          )}
        </MapContainer>
      </div>

      {(mapError || geoError) && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{geoError || mapError}</span>
        </div>
      )}

      {/* Feedback */}
      {address ? (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
          {address}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          Haz clic en el mapa o busca una dirección para marcar tu ubicación
        </p>
      )}
    </div>
  );
}
