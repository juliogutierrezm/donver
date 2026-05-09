import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { AlertCircle, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearch, parseNominatimLocation, type LocationResult } from "@/components/LocationSearch";
import { useGeolocation } from "@/hooks/use-geolocation";
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
  onLocationChange: (location: {
    coords: { lat: number; lng: number };
    formattedAddress: string;
    province?: string;
    canton?: string;
    district?: string;
  }) => void;
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
  const { getCurrentPosition, loading, error: geolocationError } = useGeolocation();
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
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
        { headers: { "Accept-Language": "es" } }
      );
      if (!res.ok) {
        throw new Error("No se pudo resolver la direccion.");
      }
      const data = await res.json();
      const location = parseNominatimLocation({
        lat: String(lat),
        lon: String(lng),
        display_name: typeof data.display_name === "string" ? data.display_name : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        address: typeof data.address === "object" && data.address ? data.address : undefined,
      });
      setAddress(location.formattedAddress);
      onLocationChange({
        coords: { lat, lng },
        formattedAddress: location.formattedAddress,
        province: location.province,
        canton: location.canton,
        district: location.district,
      });
    } catch {
      const formattedAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(formattedAddress);
      onLocationChange({
        coords: { lat, lng },
        formattedAddress,
      });
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    await reverseGeocode(lat, lng);
  };

  const handleLocationSearchSelect = (location: LocationResult) => {
    setMapError(null);
    setAddress(location.formattedAddress);
    setFlyTarget([location.lat, location.lon]);
    onLocationChange({
      coords: { lat: location.lat, lng: location.lon },
      formattedAddress: location.formattedAddress,
      province: location.province,
      canton: location.canton,
      district: location.district,
    });
  };

  const handleUseGPS = () => {
    setGeoError(null);
    void (async () => {
      const coords = await getCurrentPosition();
      if (!coords) {
        return;
      }

      setFlyTarget([coords.latitude, coords.longitude]);
      await reverseGeocode(coords.latitude, coords.longitude);
    })();
  };

  const center: [number, number] = coordinates
    ? [coordinates.lat, coordinates.lng]
    : COSTA_RICA_CENTER;

  return (
    <div className="space-y-4">
      {/* Address search */}
      <LocationSearch onLocationSelect={handleLocationSearchSelect} value={address} />

      {/* GPS button */}
      <div className="space-y-2 pt-1">
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={handleUseGPS}
          disabled={loading}
          className="h-11 w-full cursor-pointer justify-center gap-2 rounded-xl px-5 font-semibold shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium sm:w-auto"
        >
          <Navigation className="h-4 w-4" />
          {loading ? "Obteniendo ubicación…" : "Usar mi GPS"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Usa tu ubicación actual para colocar el pin automáticamente.
        </p>
      </div>

      {/* Interactive map */}
      <div className="h-56 overflow-hidden rounded-xl border border-border shadow-soft">
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

      {(mapError || geoError || geolocationError) && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{geoError || geolocationError || mapError}</span>
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
          Haz clic en el mapa o busca una dirección para marcar tu ubicación. Si el GPS falla, puedes colocar el pin manualmente.
        </p>
      )}
    </div>
  );
}
