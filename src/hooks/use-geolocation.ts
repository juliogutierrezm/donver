import { useState, useCallback } from "react";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface UseGeolocationState {
  coords: GeolocationCoords | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<UseGeolocationState>({
    coords: null,
    loading: false,
    error: null,
  });

  const getCurrentPosition = useCallback(async () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocalización no disponible en tu navegador",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise<GeolocationCoords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setState({ coords, loading: false, error: null });
          resolve(coords);
        },
        (error) => {
          const errorMessage =
            error.code === 1
              ? "Permiso de geolocalización denegado"
              : error.code === 2
                ? "Posición no disponible"
                : "Error al obtener geolocalización";
          setState({ coords: null, loading: false, error: errorMessage });
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, []);

  return {
    ...state,
    getCurrentPosition,
  };
}
