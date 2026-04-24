import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="hero-gradient min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="glass inline-flex items-center gap-3 rounded-full border px-4 py-2 shadow-soft w-fit">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <PawPrint className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                  Donver
                </p>
                <p className="text-xs text-muted-foreground">
                  Cuidado de mascotas confiable
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-heading font-extrabold leading-tight">
                Cuida tu mascota con
                <span className="block text-gradient-hero">
                  confianza en Costa Rica
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Conecta con cuidadores verificados que aman los animales. Reserva
                hospedaje, paseos o cuidados por hora con total tranquilidad.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/spaces">
                <Button
                  size="lg"
                  className="hover-lift rounded-full shadow-elegant w-full sm:w-auto"
                >
                  Buscar espacios
                </Button>
              </Link>
              <Link to="/become-caregiver">
                <Button
                  size="lg"
                  variant="secondary"
                  className="hover-lift rounded-full w-full sm:w-auto"
                >
                  Ofrecer mi espacio
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">500+</p>
                <p>Espacios activos</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">2.5k+</p>
                <p>Mascotas cuidadas</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">4.8★</p>
                <p>Calificación promedio</p>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="flex items-center justify-center">
            <div className="card-gradient animate-float relative w-full max-w-md rounded-3xl border p-8 shadow-elegant">
              <div className="glass absolute right-6 top-6 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Tropical Pet Paradise
              </div>
              <div className="flex min-h-[480px] flex-col justify-end rounded-2xl border border-primary/20 bg-card/50 p-8">
                <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                  <PawPrint className="h-12 w-12" />
                </div>
                <h2 className="font-heading text-4xl font-bold text-card-foreground">
                  Tu mascota merece lo mejor
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Reserva con confianza. Cuidadores verificados, mascotas felices,
                  dueños tranquilos.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <span className="animate-pulse-soft inline-flex rounded-full bg-secondary px-3 py-1 text-sm">
                    ✓ Verificado
                  </span>
                  <span className="animate-pulse-soft inline-flex rounded-full bg-secondary px-3 py-1 text-sm">
                    ✓ Seguro
                  </span>
                  <span className="animate-pulse-soft inline-flex rounded-full bg-secondary px-3 py-1 text-sm">
                    ✓ 24/7
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
