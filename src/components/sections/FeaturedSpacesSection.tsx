import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DonverBanner from "@/assets/Donver-Banner.webp";

export function FeaturedSpacesSection() {
  return (
    <section className="bg-card py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border shadow-elegant">
          <div className="relative aspect-[21/10] min-h-[320px] w-full md:min-h-[420px]">
            <img
              src={DonverBanner}
              alt="Perro y gato en espacios seguros de Donver"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/25" />

            <div className="absolute inset-0 flex items-center p-6 sm:p-10 lg:p-14">
              <div className="max-w-xl space-y-4 sm:space-y-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
                  Donver
                </p>

                <h2 className="font-heading text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                  Encuentra espacios seguros y confiables para tu mascota.
                </h2>

                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                  Reserva hospedajes con cuidadores reales y brinda tranquilidad a tu mascota mientras viajas.
                </p>

                <Link to="/spaces" className="inline-flex">
                  <Button size="lg" className="hover-lift rounded-full px-8">
                    Explorar espacios
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
