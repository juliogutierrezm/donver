import { Button } from "@/components/ui/button";

interface CaregiverStepOneProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    bio: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
}

export function CaregiverStepOne({
  formData,
  onChange,
  onNext,
}: CaregiverStepOneProps) {
  const isComplete = formData.name && formData.email && formData.phone && formData.bio;

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
