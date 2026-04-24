import { Shield, CreditCard, HeartHandshake } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Cuidadores verificados",
      description:
        "Todos nuestros cuidadores pasan verificación de identidad y referencias para tu tranquilidad.",
    },
    {
      icon: CreditCard,
      title: "Pago seguro",
      description:
        "Transacciones protegidas con Stripe. Tu dinero está seguro hasta que confirmes el servicio.",
    },
    {
      icon: HeartHandshake,
      title: "Soporte 24/7",
      description:
        "Nuestro equipo está siempre disponible para ayudarte ante cualquier pregunta o emergencia.",
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">
            ¿Por qué elegir Donver?
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Beneficios que te importan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-xl border border-border bg-background hover-lift group transition-all"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
