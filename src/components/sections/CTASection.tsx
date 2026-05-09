import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";
import { useAuthSessionUser } from "@/hooks/useAuthSessionUser";

export function CTASection() {
  const { authenticated, experienceMode } = useAuthSessionUser();
  const primaryCta =
    experienceMode === "caregiver_pending"
      ? { to: "/become-caregiver", label: "Continuar como cuidador" }
      : experienceMode === "caregiver" || experienceMode === "both"
        ? { to: "/caregiver/dashboard", label: "Ir a mi dashboard" }
        : { to: authenticated ? "/profile" : "/register", label: authenticated ? "Ir a mi perfil" : "Crear cuenta gratis" };

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-primary rounded-3xl p-12 md:p-16 text-white text-center shadow-elegant">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <PawPrint className="h-8 w-8" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            ¿Listo para empezar?
          </h2>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            Únete a miles de dueños de mascotas que ya confían en Donver para
            el cuidado de sus compañeros peludos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={primaryCta.to}>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 w-full sm:w-auto"
              >
                {primaryCta.label}
              </Button>
            </Link>
            <Link to="/spaces">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 w-full sm:w-auto"
              >
                Explorar espacios
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-white/70">
            Sin tarjeta de crédito requerida. Comienza en 2 minutos.
          </p>
        </div>
      </div>
    </section>
  );
}
