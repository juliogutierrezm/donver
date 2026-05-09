import { useEffect, useMemo, useState } from "react";
import { MapPin, LayoutGrid, Map, Maximize2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocationSearch, type LocationResult } from "@/components/LocationSearch";
import { SpacesMap } from "@/components/SpacesMap";
import { SpaceCard } from "@/components/SpaceCard";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getPetTypeLabel } from "@/lib/pet-labels";
import { PROVINCES, CANTONES, PET_TYPES } from "@/types";
import { spacesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { PetType, Province, Space } from "@/types";

type ViewMode = "grid" | "map" | "split";
type PriceMode = "all" | "night" | "hour";
const PRICE_MIN = 0;
const PRICE_STEP = 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizePriceValue(value: number, max: number) {
  const safeValue = clamp(value, PRICE_MIN, max);
  return Math.round(safeValue / PRICE_STEP) * PRICE_STEP;
}

function getSpacePrice(space: Space, priceMode: PriceMode) {
  if (priceMode === "night") {
    return space.pricePerNight;
  }

  if (priceMode === "hour") {
    return space.pricePerHour;
  }

  return PRICE_MIN;
}

function hasValidSpacePrice(space: Space, priceMode: PriceMode) {
  if (priceMode === "all") {
    return true;
  }

  const price = getSpacePrice(space, priceMode);
  return Number.isFinite(price) && price > 0;
}

function getPriceModeLabel(priceMode: PriceMode) {
  if (priceMode === "night") {
    return "noche";
  }

  if (priceMode === "hour") {
    return "hora";
  }

  return "reserva";
}

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
  const { loading: geoLoading, getCurrentPosition, error: geoError } = useGeolocation();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCanton, setSelectedCanton] = useState<string>("");
  const [selectedPetType, setSelectedPetType] = useState<string>("");
  const [priceMode, setPriceMode] = useState<PriceMode>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MIN]);
  const [priceInputs, setPriceInputs] = useState({ min: String(PRICE_MIN), max: String(PRICE_MIN) });
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

  const candidateSpaces = useMemo(() => {
    let filtered = spaces.filter((space) => hasValidSpacePrice(space, priceMode));

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
  }, [priceMode, searchLocation, searchRadius, spaces]);

  const dynamicPriceMax = useMemo(() => {
    if (priceMode === "all") {
      return PRICE_MIN;
    }

    const highestPrice = candidateSpaces.reduce((max, space) => {
      const price = getSpacePrice(space, priceMode);
      return price > max ? price : max;
    }, 0);

    if (highestPrice <= 0) {
      return PRICE_MIN;
    }

    return Math.ceil(highestPrice / PRICE_STEP) * PRICE_STEP;
  }, [candidateSpaces, priceMode]);

  const handlePriceInputChange = (field: "min" | "max", rawValue: string) => {
    const nextValue = rawValue.replace(/[^\d]/g, "");
    const nextInputs = { ...priceInputs, [field]: nextValue };
    setPriceInputs(nextInputs);

    const parsedMin = Number.parseInt(nextInputs.min || String(PRICE_MIN), 10);
    const parsedMax = Number.parseInt(nextInputs.max || String(dynamicPriceMax), 10);
    const safeMin = normalizePriceValue(Number.isFinite(parsedMin) ? parsedMin : PRICE_MIN, dynamicPriceMax);
    const safeMax = normalizePriceValue(Number.isFinite(parsedMax) ? parsedMax : dynamicPriceMax, dynamicPriceMax);

    setPriceRange([Math.min(safeMin, safeMax), Math.max(safeMin, safeMax)]);
  };

  const handlePriceSliderChange = (field: "min" | "max", rawValue: string) => {
    const nextValue = normalizePriceValue(Number.parseInt(rawValue, 10), dynamicPriceMax);
    const [currentMin, currentMax] = priceRange;
    const nextRange: [number, number] =
      field === "min"
        ? [Math.min(nextValue, currentMax), currentMax]
        : [currentMin, Math.max(nextValue, currentMin)];

    setPriceRange(nextRange);
    setPriceInputs({
      min: String(nextRange[0]),
      max: String(nextRange[1]),
    });
  };

  useEffect(() => {
    if (priceMode === "all") {
      setPriceRange([PRICE_MIN, PRICE_MIN]);
      setPriceInputs({
        min: "",
        max: "",
      });
      return;
    }

    setPriceRange([PRICE_MIN, dynamicPriceMax]);
    setPriceInputs({
      min: String(PRICE_MIN),
      max: String(dynamicPriceMax),
    });
  }, [dynamicPriceMax, priceMode]);

  useEffect(() => {
    if (priceMode === "all") {
      return;
    }

    setPriceRange((currentRange) => {
      const nextMin = clamp(currentRange[0], PRICE_MIN, dynamicPriceMax);
      const nextMax = clamp(currentRange[1], nextMin, dynamicPriceMax);

      if (nextMin === currentRange[0] && nextMax === currentRange[1]) {
        return currentRange;
      }

      return [nextMin, nextMax];
    });

    setPriceInputs((currentInputs) => {
      const currentMin = Number.parseInt(currentInputs.min || String(PRICE_MIN), 10);
      const currentMax = Number.parseInt(currentInputs.max || String(dynamicPriceMax), 10);
      const nextMin = clamp(Number.isFinite(currentMin) ? currentMin : PRICE_MIN, PRICE_MIN, dynamicPriceMax);
      const nextMax = clamp(Number.isFinite(currentMax) ? currentMax : dynamicPriceMax, nextMin, dynamicPriceMax);

      const normalizedInputs = {
        min: String(nextMin),
        max: String(nextMax),
      };

      if (normalizedInputs.min === currentInputs.min && normalizedInputs.max === currentInputs.max) {
        return currentInputs;
      }

      return normalizedInputs;
    });
  }, [dynamicPriceMax, priceMode]);

  const handleUseCurrentLocation = async () => {
    const currentCoords = await getCurrentPosition();

    if (!currentCoords) {
      toast({
        title: "No pudimos usar tu ubicación",
        description: "Revisa los permisos del navegador o usa la búsqueda manual.",
        variant: "destructive",
      });
      return;
    }

    setSearchLocation({
      lat: currentCoords.latitude,
      lon: currentCoords.longitude,
      displayName: "Tu ubicación actual",
      formattedAddress: "Tu ubicación actual",
    });

    toast({
      title: "Ubicación aplicada",
      description: "Usaremos tu ubicación actual para ordenar y filtrar los espacios cercanos.",
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSpaces() {
      setLoadingSpaces(true);
      setSpacesError(null);
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
        const message =
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.";
        setSpacesError(message);
        toast({
          title: "No se pudieron cargar los espacios",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setLoadingSpaces(false);
        }
      }
    }

    void loadSpaces();
    return () => {
      cancelled = true;
    };
  }, [selectedProvince, selectedCanton, selectedPetType, toast]);

  const filteredSpaces = useMemo(
    () => {
      if (priceMode === "all") {
        return candidateSpaces;
      }

      return candidateSpaces.filter((space) => {
        const price = getSpacePrice(space, priceMode);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    },
    [candidateSpaces, priceMode, priceRange]
  );

  const mapUserLocation = useMemo(() => {
    if (searchLocation) {
      return searchLocation;
    }

    return null;
  }, [searchLocation]);

  const safeSliderMax = Math.max(dynamicPriceMax, PRICE_STEP);
  const sliderStart = dynamicPriceMax === 0 ? 0 : ((priceRange[0] - PRICE_MIN) / (safeSliderMax - PRICE_MIN)) * 100;
  const sliderEnd = dynamicPriceMax === 0 ? 0 : ((priceRange[1] - PRICE_MIN) / (safeSliderMax - PRICE_MIN)) * 100;

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
                      {getPetTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-3">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Tipo de reserva
                </label>
                <Tabs value={priceMode} onValueChange={(value) => setPriceMode(value as PriceMode)} className="w-full">
                  <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/60 p-1.5">
                    <TabsTrigger
                      value="all"
                      className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Todos
                    </TabsTrigger>
                    <TabsTrigger
                      value="night"
                      className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Por noche
                    </TabsTrigger>
                    <TabsTrigger
                      value="hour"
                      className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Por hora
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {priceMode === "all"
                  ? "Rango de precio"
                  : `Rango de precio por ${getPriceModeLabel(priceMode)}: ₡${priceRange[0].toLocaleString("es-CR")} - ₡${priceRange[1].toLocaleString("es-CR")}`}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={priceInputs.min}
                  onChange={(e) => handlePriceInputChange("min", e.target.value)}
                  placeholder={priceMode === "all" ? "Selecciona tipo de reserva" : `Precio mínimo por ${getPriceModeLabel(priceMode)}`}
                  disabled={priceMode === "all"}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={priceInputs.max}
                  onChange={(e) => handlePriceInputChange("max", e.target.value)}
                  placeholder={priceMode === "all" ? "Selecciona tipo de reserva" : `Precio máximo por ${getPriceModeLabel(priceMode)}`}
                  disabled={priceMode === "all"}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="relative mt-5 px-1 py-3">
                <div className="pointer-events-none absolute left-1 right-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
                <div
                  className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
                  style={{
                    left: `calc(${sliderStart}% + 0.25rem)`,
                    right: `calc(${100 - sliderEnd}% + 0.25rem)`,
                  }}
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={dynamicPriceMax}
                  step={PRICE_STEP}
                  value={priceRange[0]}
                  onChange={(e) => handlePriceSliderChange("min", e.target.value)}
                  aria-label="Precio mínimo"
                  disabled={priceMode === "all"}
                  className="pointer-events-none absolute inset-0 z-20 h-full w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_hsl(var(--primary)),0_6px_16px_rgba(0,0,0,0.18)] [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-none"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={dynamicPriceMax}
                  step={PRICE_STEP}
                  value={priceRange[1]}
                  onChange={(e) => handlePriceSliderChange("max", e.target.value)}
                  aria-label="Precio máximo"
                  disabled={priceMode === "all"}
                  className="pointer-events-none absolute inset-0 z-30 h-full w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_hsl(var(--primary)),0_6px_16px_rgba(0,0,0,0.18)] [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-none"
                />
              </div>
              {priceMode === "all" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Estás viendo todos los espacios disponibles. Selecciona “Por noche” o “Por hora” para activar el filtro de precio.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => void handleUseCurrentLocation()}
                disabled={geoLoading}
                variant="outline"
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                {geoLoading ? "Localizando..." : "Usar mi ubicación"}
              </Button>
            </div>
            {geoError && (
              <p className="mt-3 text-sm text-destructive">
                {geoError}. Si prefieres, también puedes buscar la ubicación manualmente.
              </p>
            )}
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
                {loadingSpaces ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Cargando espacios...
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Estamos buscando opciones disponibles para tu mascota.
                    </p>
                  </div>
                ) : spacesError ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No se pudieron cargar los espacios
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">{spacesError}</p>
                  </div>
                ) : filteredSpaces.length === 0 ? (
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
