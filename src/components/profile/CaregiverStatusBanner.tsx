import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getUserExperienceMode } from "@/services/api";
import type { User } from "@/types";

interface CaregiverStatusBannerProps {
  user: User;
  onCreateSpace?: () => void;
}

export function CaregiverStatusBanner({ user, onCreateSpace }: CaregiverStatusBannerProps) {
  const mode = getUserExperienceMode(user);
  const status = user.caregiverStatus;
  const fieldLabels: Record<string, string> = {
    name: "nombre",
    phone: "teléfono",
    province: "provincia",
    canton: "cantón",
    bio: "biografía",
  };

  if (mode === "owner") {
    return null;
  }

  if (mode === "caregiver_pending") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Registro de cuidador pendiente</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tu cuenta ya existe, pero aún debes completar tu perfil de cuidador para entrar al dashboard y publicar espacios.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-xl">
            <Link to="/become-caregiver">Continuar registro</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!status || status.operationalReady) {
    return null;
  }

  const needsProfile = !status.profileComplete;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="font-semibold text-amber-900">
              {needsProfile ? "Completa tu perfil de cuidador" : "Tu cuenta aún no está lista para operar"}
            </h3>
            <p className="text-sm leading-relaxed text-amber-800">
              {needsProfile
                ? `Faltan datos obligatorios: ${status.missingProfileFields.map((field) => fieldLabels[field] ?? field).join(", ")}.`
                : "Crea o completa al menos un espacio con fotos y precios para poder publicarlo y recibir reservas."}
            </p>
          </div>
        </div>
        {needsProfile ? (
          <Button asChild variant="outline" className="rounded-xl border-amber-400 bg-white">
            <Link to="/become-caregiver">Completar perfil</Link>
          </Button>
        ) : onCreateSpace ? (
          <Button type="button" variant="outline" className="rounded-xl border-amber-400 bg-white" onClick={onCreateSpace}>
            Crear espacio
          </Button>
        ) : (
          <Button asChild variant="outline" className="rounded-xl border-amber-400 bg-white">
            <Link to="/caregiver/dashboard">Ir al dashboard</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
