import { Button } from "@/components/ui/button";

interface CaregiverStepOneProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    password?: string;
    confirmPassword?: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  requirePassword?: boolean;
}

export function CaregiverStepOne({
  formData,
  onChange,
  onNext,
  requirePassword = false,
}: CaregiverStepOneProps) {
  const hasPassword = !requirePassword || (formData.password && formData.confirmPassword);
  const passwordsMatch =
    !requirePassword || formData.password === formData.confirmPassword;
  const isComplete = formData.name && formData.email && formData.phone && formData.bio && hasPassword && passwordsMatch;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Nombre completo
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Tu nombre"
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Teléfono
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+506 8765 4321"
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Cuéntanos sobre ti
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Describe tu experiencia cuidando mascotas, qué te hace especial como cuidador..."
          rows={4}
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {requirePassword && (
        <>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Contraseña
            </label>
            <input
              type="password"
              value={formData.password ?? ""}
              onChange={(e) => onChange("password", e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={formData.confirmPassword ?? ""}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {formData.confirmPassword && !passwordsMatch && (
              <p className="mt-2 text-sm text-destructive">
                Las contraseñas deben coincidir para continuar.
              </p>
            )}
          </div>
        </>
      )}

      <Button
        onClick={onNext}
        disabled={!isComplete}
        className="w-full"
      >
        Siguiente
      </Button>
    </div>
  );
}
