import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getUserExperienceMode } from "@/services/api";
import type { User } from "@/types";

interface UserInfoCardProps {
  user: User;
  onLogout?: () => void;
  onSetActiveRole?: (role: User["activeRole"]) => void;
}

export function UserInfoCard({ user, onLogout, onSetActiveRole }: UserInfoCardProps) {
  const experienceMode = getUserExperienceMode(user);
  const activeRole = user.activeRole ?? user.roles[0] ?? "owner";
  const roleLabel =
    experienceMode === "caregiver_pending"
      ? "Registro de cuidador pendiente"
      : activeRole === "caregiver"
        ? "Cuidador"
        : "Dueño";

  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <div className="mb-6 flex justify-center">
        <img
          src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
          alt={user.name}
          className="h-24 w-24 rounded-full border-4 border-primary object-cover"
        />
      </div>

      <h2 className="mb-1 text-2xl font-heading font-bold text-foreground">{user.name}</h2>
      <p className="mb-4 text-muted-foreground">{user.email}</p>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
        {roleLabel}
      </div>

      {user.roles.length > 1 && onSetActiveRole && experienceMode !== "caregiver_pending" && (
        <div className="mb-6 space-y-2 text-left">
          <p className="text-sm font-medium text-muted-foreground">Vista activa</p>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Button
                key={role}
                type="button"
                size="sm"
                variant={role === activeRole ? "default" : "outline"}
                onClick={() => onSetActiveRole(role)}
              >
                {role === "owner" ? "Como dueño" : "Como cuidador"}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 space-y-2 border-y border-border py-4">
        <p className="text-sm text-muted-foreground">📍 Ubicación</p>
        <p className="font-semibold text-foreground">
          {user.canton}, {user.province}
        </p>
      </div>

      <div className="mb-6 space-y-2 py-4">
        <p className="text-sm text-muted-foreground">Teléfono</p>
        <p className="font-semibold text-foreground">{user.phone || "No registrado"}</p>
      </div>

      <div className="flex flex-col gap-2">
        {experienceMode === "caregiver_pending" ? (
          <Button asChild className="w-full">
            <Link to="/become-caregiver">Continuar registro de cuidador</Link>
          </Button>
        ) : user.roles.includes("caregiver") ? (
          <Button asChild className="w-full">
            <Link to="/caregiver/dashboard">Ir al dashboard</Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link to="/become-caregiver">Quiero ser cuidador</Link>
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={onLogout}>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
