import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getUserExperienceMode } from "@/services/api";
import { APP_ROUTES } from "@/lib/routes";
import type { User } from "@/types";

interface UserInfoCardProps {
  user: User;
  onLogout?: () => void;
  onSetActiveRole?: (role: User["activeRole"]) => void;
}

export function UserInfoCard({ user, onLogout, onSetActiveRole }: UserInfoCardProps) {
  const experienceMode = getUserExperienceMode(user);
  const hasOwnerRole = user.roles.includes("owner");
  const hasCaregiverRole = user.roles.includes("caregiver");
  const activeRole =
    experienceMode === "both" && user.activeRole === "caregiver" ? "caregiver" : hasOwnerRole ? "owner" : "caregiver";
  const roleLabel =
    experienceMode === "caregiver_pending"
      ? "Registro de cuidador pendiente"
      : experienceMode === "both"
        ? "Dueño y cuidador"
        : activeRole === "caregiver"
        ? "Cuidador"
        : "Dueño";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft transition-shadow duration-200 hover:shadow-medium sm:p-7">
      <div className="mb-5 flex justify-center">
        <img
          src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
          alt={user.name}
          className="h-24 w-24 rounded-full border-4 border-primary object-cover"
        />
      </div>

      <h2 className="mb-1 text-2xl font-heading font-bold text-foreground">{user.name}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{user.email}</p>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
        {roleLabel}
      </div>

      {experienceMode === "both" && onSetActiveRole && (
        <div className="mb-6 rounded-2xl border border-border/70 bg-muted/30 p-4 text-left">
          <p className="text-sm font-medium text-muted-foreground">Vista activa</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["owner", "caregiver"] as const).map((role) => (
              <Button
                key={role}
                type="button"
                size="sm"
                variant={role === activeRole ? "default" : "outline"}
                className="rounded-full"
                onClick={() => onSetActiveRole(role)}
              >
                {role === "owner" ? "Como dueño" : "Como cuidador"}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-4 text-left">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Ubicación</p>
          <p className="text-sm font-medium text-foreground/85">
            {user.canton}, {user.province}
          </p>
        </div>
        <div className="space-y-1 border-t border-border/60 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Teléfono</p>
          <p className="text-sm font-medium text-foreground/85">{user.phone || "No registrado"}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {experienceMode === "caregiver_pending" ? (
          <Button asChild size="lg" className="h-11 w-full rounded-xl shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium">
            <Link to={APP_ROUTES.becomeCaregiver}>Continuar registro de cuidador</Link>
          </Button>
        ) : experienceMode === "caregiver" ? (
          <Button asChild size="lg" className="h-11 w-full rounded-xl shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium">
            <Link to={APP_ROUTES.becomeOwner}>Activar perfil de dueño</Link>
          </Button>
        ) : hasCaregiverRole ? (
          <Button asChild size="lg" className="h-11 w-full rounded-xl shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium">
            <Link to={APP_ROUTES.caregiverDashboard}>Ir al dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="h-11 w-full rounded-xl shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium">
            <Link to={APP_ROUTES.becomeCaregiver}>Quiero ser cuidador</Link>
          </Button>
        )}
        <Button variant="outline" className="w-full rounded-xl text-muted-foreground transition-colors duration-200 hover:text-foreground" onClick={onLogout}>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
