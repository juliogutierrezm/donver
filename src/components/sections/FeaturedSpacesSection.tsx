import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceCard } from "@/components/SpaceCard";
import { mockSpaces } from "@/data/mockData";

export function FeaturedSpacesSection() {
  const featuredSpaces = mockSpaces.slice(0, 3);

  return (
    <section className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">
              Espacios destacados
            </p>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
              Lugares confiables
            </h2>
          </div>
          <Link to="/spaces" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featuredSpaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>

        <Link to="/spaces" className="block sm:hidden">
          <Button variant="outline" className="w-full gap-2">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
