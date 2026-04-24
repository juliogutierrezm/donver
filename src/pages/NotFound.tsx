import { Link } from "react-router-dom";
import { Compass, Home, SearchX } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center">
        <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant md:p-12">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SearchX className="h-8 w-8" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Error 404
            </p>
            <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">
              Esta huellita se perdió del mapa
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              La página que buscas no existe o cambió de ubicación. Puedes volver al inicio o
              seguir explorando los espacios disponibles en Donver.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Volver al inicio
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/spaces">
                  <Compass className="h-4 w-4" />
                  Explorar espacios
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
