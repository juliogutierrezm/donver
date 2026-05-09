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
    if (typeof window !== "undefined" && !window.isSecureContext) {
      const error = "La ubicación solo funciona en una conexión segura (HTTPS).";
      setState({ coords: null, loading: false, error });
      return null;
    }

    if (!navigator.geolocation) {
      const error = "Tu navegador no soporta geolocalización.";
      setState((prev) => ({ ...prev, error }));
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    let permissionState: PermissionState | null = null;

    if ("permissions" in navigator && navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        permissionState = permission.state;
      } catch {
        permissionState = null;
      }
    }

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
              ? permissionState === "denied"
                ? "El navegador bloqueó el permiso de ubicación. Actívalo en la configuración del sitio."
                : "No diste permiso para usar tu ubicación."
              : error.code === 2
                ? "No pudimos detectar tu ubicación actual. Intenta moverte a una zona con mejor señal."
                : "Se agotó el tiempo para obtener tu ubicación. Intenta nuevamente.";
          setState({ coords: null, loading: false, error: errorMessage });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  return {
    ...state,
    getCurrentPosition,
  };
}
