import { User } from "@/types";
import { Button } from "@/components/ui/button";

interface UserInfoCardProps {
  user: User;
  onLogout?: () => void;
}

export function UserInfoCard({ user, onLogout }: UserInfoCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      {/* Avatar */}
      <div className="mb-6 flex justify-center">
        <img
          src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
          alt={user.name}
          className="w-24 h-24 rounded-full border-4 border-primary"
        />
      </div>

      {/* Info */}
      <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
        {user.name}
      </h2>
      <p className="text-muted-foreground mb-4">{user.email}</p>

      {/* Role Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
        {user.role === "owner"
          ? "🐱 Dueño"
          : user.role === "caregiver"
            ? "👨‍💼 Cuidador"
            : "🤝 Ambos"}
      </div>

      {/* Location */}
      <div className="space-y-2 py-4 border-y border-border mb-6">
        <p className="text-sm text-muted-foreground">📍 Ubicación</p>
        <p className="font-semibold text-foreground">
          {user.canton}, {user.province}
        </p>
      </div>

      {/* Contact */}
      <div className="space-y-2 py-4 mb-6">
        <p className="text-sm text-muted-foreground">Teléfono</p>
        <p className="font-semibold text-foreground">{user.phone || "No registrado"}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button className="w-full">Editar Perfil</Button>
        <Button variant="outline" className="w-full" onClick={onLogout}>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
