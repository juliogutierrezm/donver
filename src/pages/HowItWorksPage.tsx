import { CalendarCheck, HeartHandshake, Home, MessageCircle, PawPrint, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const ownerSteps = [
  {
    icon: Search,
    title: "Explora espacios ideales",
    description:
      "Busca opciones por provincia, cantón, tipo de mascota, precio y amenidades para encontrar el lugar adecuado.",
  },
  {
    icon: MessageCircle,
    title: "Habla con el cuidador",
    description:
      "Aclara rutinas, horarios, alimentación y cualquier necesidad especial antes de confirmar.",
  },
  {
    icon: CalendarCheck,
    title: "Reserva con tranquilidad",
    description:
      "Selecciona las fechas disponibles y deja todo coordinado con suficiente contexto para el cuidado.",
  },
];

const caregiverSteps = [
  {
    icon: Home,
    title: "Publica tu espacio",
    description:
      "Completa tu perfil como cuidador, describe tu espacio, agrega ubicación, fotos y define precios por noche u hora.",
  },
  {
    icon: PawPrint,
    title: "Define tus condiciones",
    description:
      "Indica qué tipos y tamaños de mascotas aceptas, tu capacidad máxima y las amenidades disponibles.",
  },
  {
    icon: HeartHandshake,
    title: "Gestiona reservas y confianza",
    description:
      "Responde mensajes, bloquea fechas desde tu dashboard y construye relaciones confiables con los dueños.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="hero-gradient border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Cómo funciona
              </p>
              <h1 className="mt-4 text-4xl font-bold text-foreground md:text-5xl">
                Donver conecta hogares confiables con mascotas que merecen cuidado especial
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Diseñamos una experiencia clara para dueños que buscan tranquilidad y cuidadores
                que quieren ofrecer un espacio seguro en Costa Rica.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Para dueños
              </p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">
                Encuentra el espacio correcto para tu mascota
              </h2>
              <div className="mt-8 space-y-5">
                {ownerSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="flex gap-4 rounded-2xl border border-border/70 bg-secondary/35 p-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Paso {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Para cuidadores
              </p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">
                Convierte tu espacio en una opción confiable
              </h2>
              <div className="mt-8 space-y-5">
                {caregiverSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="flex gap-4 rounded-2xl border border-border/70 bg-accent/35 p-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Paso {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-primary p-[1px] shadow-elegant">
            <div className="rounded-[calc(var(--radius)*1.5)] bg-card px-6 py-8 md:px-10 md:py-10">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-3xl font-bold text-foreground">1</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Plataforma para descubrir espacios y conectar con cuidadores.
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">2</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dashboard para gestionar disponibilidad, fotos y condiciones.
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">3</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Mensajería para alinear expectativas y cuidar mejor a cada mascota.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
