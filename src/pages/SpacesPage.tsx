import { useEffect, useMemo, useState } from "react";
import { MapPin, LayoutGrid, Map, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocationSearch, type LocationResult } from "@/components/LocationSearch";
import { SpacesMap } from "@/components/SpacesMap";
import { SpaceCard } from "@/components/SpaceCard";
import { useGeolocation } from "@/hooks/use-geolocation";
import { PROVINCES, CANTONES, PET_TYPES } from "@/types";
import { spacesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { PetType, Province, Space } from "@/types";

type ViewMode = "grid" | "map" | "split";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function hasValidSpaceCoordinates(space: Space) {
  return (
    Number.isFinite(space.latitude) &&
    Number.isFinite(space.longitude) &&
    Math.abs(space.latitude) <= 90 &&
    Math.abs(space.longitude) <= 180
  );
}

export default function SpacesPage() {
  const { toast } = useToast();
  const { coords, loading: geoLoading, getCurrentPosition } = useGeolocation();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCanton, setSelectedCanton] = useState<string>("");
  const [selectedPetType, setSelectedPetType] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [searchRadius, setSearchRadius] = useState(25);
  const [searchLocation, setSearchLocation] = useState<LocationResult | null>(null);

  const cantons = useMemo(() => {
    if (!selectedProvince) return [];
    return CANTONES[selectedProvince as keyof typeof CANTONES] || [];
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedProvince && !cantons.includes(selectedCanton)) {
      setSelectedCanton("");
    }
  }, [cantons, selectedCanton, selectedProvince]);

  useEffect(() => {
    let cancelled = false;

    async function loadSpaces() {
      try {
        const data = await spacesApi.list({
          province: (selectedProvince || undefined) as Province | undefined,
          canton: selectedCanton || undefined,
          petType: (selectedPetType || undefined) as PetType | undefined,
        });
        if (cancelled) return;
        setSpaces(data);
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "No se pudieron cargar los espacios",
          description:
            error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
          variant: "destructive",
        });
      }
    }

    void loadSpaces();
    return () => {
      cancelled = true;
    };
  }, [selectedProvince, selectedCanton, selectedPetType, toast]);

  const filteredSpaces = useMemo(() => {
    let filtered = spaces.filter(
      (space) => space.pricePerNight >= priceRange[0] && space.pricePerNight <= priceRange[1]
    );

    if (searchLocation) {
      filtered = filtered
        .filter((space) => {
          if (!hasValidSpaceCoordinates(space)) {
            return false;
          }

          const distance = calculateDistance(
            searchLocation.lat,
            searchLocation.lon,
            space.latitude,
            space.longitude
          );
          return distance <= searchRadius;
        })
        .sort((a, b) => {
          const distA = calculateDistance(
            searchLocation.lat,
            searchLocation.lon,
            a.latitude,
            a.longitude
          );
          const distB = calculateDistance(
            searchLocation.lat,
            searchLocation.lon,
            b.latitude,
            b.longitude
          );
          return distA - distB;
        });
    }

    return filtered;
  }, [priceRange, searchLocation, searchRadius, spaces]);

  const mapUserLocation = useMemo(() => {
    if (searchLocation) {
      return searchLocation;
    }

    if (coords) {
      return { lat: coords.latitude, lon: coords.longitude };
    }

    return null;
  }, [coords, searchLocation]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
              Busca espacios para tu mascota
            </h1>
            <p className="text-muted-foreground">
              Encuentra los mejores cuidadores en Costa Rica
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="lg:col-span-2">
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Buscar por ubicación
                </label>
                <LocationSearch
                  onLocationSelect={setSearchLocation}
                  placeholder="Escriba una dirección..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Provincia
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todas</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Cantón
                </label>
                <select
                  value={selectedCanton}
                  onChange={(e) => setSelectedCanton(e.target.value)}
                  disabled={!selectedProvince}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Todos</option>
                  {cantons.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Tipo de mascota
                </label>
                <select
                  value={selectedPetType}
                  onChange={(e) => setSelectedPetType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todas</option>
                  {PET_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "dog"
                        ? "Perros"
                        : type === "cat"
                          ? "Gatos"
                          : type === "bird"
                            ? "Pájaros"
                            : "Otros"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Rango de precio por noche: ₡{priceRange[0].toLocaleString("es-CR")} - ₡
                {priceRange[1].toLocaleString("es-CR")}
              </label>
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => getCurrentPosition()}
                disabled={geoLoading}
                variant="outline"
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                {geoLoading ? "Localizando..." : "Usar mi ubicación"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-semibold text-foreground">Vista:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
                className="gap-2"
              >
                <Map className="w-4 h-4" />
                Mapa
              </Button>
              <Button
                size="sm"
                variant={viewMode === "split" ? "default" : "outline"}
                onClick={() => setViewMode("split")}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Split
              </Button>
            </div>
          </div>

          <div className={viewMode === "split" ? "flex flex-col gap-6 lg:flex-row" : ""}>
            {(viewMode === "grid" || viewMode === "split") && (
              <div className={viewMode === "split" ? "lg:w-1/2 lg:pr-4" : ""}>
                {filteredSpaces.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No hay espacios disponibles
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Intenta ajustar tus filtros o buscar en otra ubicación.
                    </p>
                  </div>
                ) : (
                  <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Se encontraron{" "}
                    <span className="font-semibold text-foreground">{filteredSpaces.length}</span>{" "}
                    espacios
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSpaces.map((space) => (
                      <SpaceCard key={space.id} space={space} />
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}

            {(viewMode === "map" || viewMode === "split") && (
              <div
                className={
                  viewMode === "split"
                    ? "lg:w-1/2 lg:pl-4 mt-0 h-[600px]"
                    : "h-[600px]"
                }
              >
                <SpacesMap
                  spaces={filteredSpaces}
                  userLocation={mapUserLocation}
                  searchRadius={searchRadius}
                  onRadiusChange={setSearchRadius}
                  resultCount={filteredSpaces.length}
                  viewMode={viewMode}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
