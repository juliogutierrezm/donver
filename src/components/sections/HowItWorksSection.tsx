import { Search, Calendar, Heart } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: "Busca",
      description:
        "Explora espacios disponibles cerca de ti, filtra por tipo de mascota, precio y amenidades.",
    },
    {
      number: 2,
      icon: Calendar,
      title: "Reserva",
      description:
        "Elige las fechas y horarios que necesitas. Comunícate directamente con el cuidador.",
    },
    {
      number: 3,
      icon: Heart,
      title: "Disfruta",
      description:
        "Tu mascota está en buenas manos. Recibe actualizaciones y comparte momentos especiales.",
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">
            Proceso simple
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Tres pasos para cuidar bien
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-primary" />
                )}

                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Number Circle */}
                  <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-white shadow-elegant">
                    <span className="font-heading text-4xl font-bold">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-heading font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground max-w-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
