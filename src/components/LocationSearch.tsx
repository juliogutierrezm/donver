import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PROVINCES } from "@/types";

export interface LocationResult {
  lat: number;
  lon: number;
  displayName: string;
  formattedAddress: string;
  province?: string;
  canton?: string;
  district?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  placeholder?: string;
  value?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    state?: string;
    province?: string;
    county?: string;
    municipality?: string;
    city?: string;
    city_district?: string;
    suburb?: string;
    neighbourhood?: string;
    village?: string;
    town?: string;
    hamlet?: string;
  };
}

function normalizeLocationValue(value?: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeProvinceName(value?: string) {
  if (!value) return undefined;

  const normalizedValue = normalizeLocationValue(value);
  return PROVINCES.find((province) => normalizeLocationValue(province) === normalizedValue);
}

function cleanAdministrativeName(value?: string) {
  const nextValue = value?.trim();
  return nextValue ? nextValue : undefined;
}

export function parseNominatimLocation(result: NominatimResult): LocationResult {
  const formattedAddress = result.display_name || `${result.lat}, ${result.lon}`;

  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: formattedAddress,
    formattedAddress,
    province: normalizeProvinceName(result.address?.state ?? result.address?.province),
    canton: cleanAdministrativeName(
      result.address?.county ?? result.address?.municipality ?? result.address?.city
    ),
    district: cleanAdministrativeName(
      result.address?.city_district ??
        result.address?.suburb ??
        result.address?.neighbourhood ??
        result.address?.village ??
        result.address?.town ??
        result.address?.hamlet
    ),
  };
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Buscar ubicación...",
  value,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const blurTimerRef = useRef<NodeJS.Timeout>();
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (typeof value === "string" && value !== query) {
      skipNextSearchRef.current = true;
      setQuery(value);
      setResults([]);
      setFeedback(null);
      setShowResults(false);
    }
  }, [query, value]);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setFeedback(null);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&format=json&addressdetails=1&accept-language=es&countrycodes=cr&limit=5`
        );
        const data = await response.json();
        const nextResults = Array.isArray(data) ? data : [];
        setResults(nextResults);
        setShowResults(true);
        setFeedback(nextResults.length === 0 ? "No encontramos resultados para esa búsqueda." : null);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setResults([]);
        setFeedback("No se pudo consultar ubicaciones en este momento.");
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, [query]);

  const handleSelectLocation = (result: NominatimResult) => {
    const location = parseNominatimLocation(result);
    onLocationSelect(location);
    skipNextSearchRef.current = true;
    setQuery(location.formattedAddress);
    setShowResults(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && results.length > 0 && setShowResults(true)}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => setShowResults(false), 150);
          }}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-soft z-50">
          <ul className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSelectLocation(result)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground">
                      {result.display_name.split(",")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback && (
        <p className={cn("mt-2 text-xs", results.length === 0 ? "text-muted-foreground" : "text-destructive")}>
          {feedback}
        </p>
      )}
    </div>
  );
}
