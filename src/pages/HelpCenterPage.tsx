import { CircleHelp, LifeBuoy, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    value: "item-1",
    question: "¿Cómo reservo un espacio para mi mascota?",
    answer:
      "Explora los espacios disponibles, revisa fotos, precios y amenidades, y luego selecciona tus fechas para enviar o confirmar la reservación con el cuidador.",
  },
  {
    value: "item-2",
    question: "¿Puedo hablar con el cuidador antes de reservar?",
    answer:
      "Sí. Donver incluye mensajería directa para resolver dudas sobre rutinas, horarios, requisitos especiales y cualquier detalle importante antes de confirmar.",
  },
  {
    value: "item-3",
    question: "¿Qué tipo de mascotas aceptan los cuidadores?",
    answer:
      "Cada espacio indica claramente los tipos y tamaños de mascotas aceptadas. Así puedes encontrar opciones compatibles con perros, gatos u otras necesidades específicas.",
  },
  {
    value: "item-4",
    question: "¿Qué pasa si necesito cancelar o cambiar una reserva?",
    answer:
      "Podrás coordinar ajustes directamente con el cuidador desde la conversación asociada. En fases posteriores se integrarán políticas automáticas de cancelación y reembolso.",
  },
  {
    value: "item-5",
    question: "¿Cómo me convierto en cuidador en Donver?",
    answer:
      "Ingresa a “Ofrecer mi espacio”, completa la información de tu espacio, agrega ubicación, precios, fotos y disponibilidad. Luego podrás administrarlo desde tu dashboard.",
  },
  {
    value: "item-6",
    question: "¿Cómo protege Donver a las mascotas y a sus dueños?",
    answer:
      "Priorizamos perfiles claros, comunicación previa, información transparente de espacios y herramientas para que dueños y cuidadores coordinen expectativas con confianza.",
  },
];

const supportHighlights = [
  {
    icon: CircleHelp,
    title: "Preguntas frecuentes",
    description: "Encuentra respuestas rápidas sobre reservas, mensajería, perfiles y cuidados.",
  },
  {
    icon: MessageSquare,
    title: "Comunicación directa",
    description: "Aclara detalles con cada cuidador antes de dejar a tu mascota en sus manos.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza primero",
    description: "Información clara para que tomes decisiones con tranquilidad.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="hero-gradient border-b border-border">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 text-center sm:px-6 lg:px-8 md:py-20">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-soft">
              <LifeBuoy className="h-7 w-7" />
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Centro de ayuda
              </p>
              <h1 className="text-4xl font-bold text-foreground md:text-5xl">
                Todo lo que necesitas para usar Donver con confianza
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Resolvemos las dudas más comunes de dueños y cuidadores para que la experiencia
                sea simple, transparente y amigable para cada mascota.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {supportHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="card-gradient rounded-3xl border border-border p-6 shadow-soft"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                FAQ
              </p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">
                Respuestas rápidas para avanzar sin fricción
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.value} value={item.value}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-primary p-[1px] shadow-elegant">
            <div className="rounded-[calc(var(--radius)*1.5)] bg-card px-6 py-8 text-center md:px-10">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                ¿Necesitas ayuda adicional?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Nuestro siguiente paso es centralizar soporte y seguimiento. Mientras tanto, puedes
                escribirnos directamente.
              </p>
              <a
                href="mailto:soporte@donver.cr"
                className="mt-5 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                soporte@donver.cr
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
