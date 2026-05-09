import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import type { Space } from "@/types";
import { getPetTypeIcon, getPetTypeLabel } from "@/lib/pet-labels";
import { cn } from "@/lib/utils";

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link
      to={`/spaces/${space.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card hover-lift shadow-soft transition-all"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <img
          src={space.photos[0]}
          alt={space.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-heading font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {space.title}
          </h3>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            {space.canton}, {space.province}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(space.rating)
                    ? "fill-accent text-accent"
                    : "text-muted"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({space.reviewCount})
          </span>
        </div>

        {/* Prices */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Por noche</p>
            <p className="font-semibold text-primary">
              ₡{space.pricePerNight.toLocaleString("es-CR")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Por hora</p>
            <p className="font-semibold text-primary">
              ₡{space.pricePerHour.toLocaleString("es-CR")}
            </p>
          </div>
        </div>

        {/* Pet Types */}
        <div className="flex flex-wrap gap-1">
          {space.acceptedPetTypes.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground"
            >
              <span>{getPetTypeIcon(type)}</span>
              <span>{getPetTypeLabel(type)}</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
