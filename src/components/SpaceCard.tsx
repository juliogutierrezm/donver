import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2, MapPin, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import type { Space } from "@/types";
import { getPetTypeIcon, getPetTypeLabel } from "@/lib/pet-labels";
import { cn } from "@/lib/utils";

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  const { toast } = useToast();
  const { canUseFavorites, isFavorite, isUpdatingFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(space.id);
  const updatingFavorite = isUpdatingFavorite(space.id);

  const handleFavoriteClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await toggleFavorite(space);
    } catch (error) {
      toast({
        title: "No se pudieron actualizar tus favoritos",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    }
  };

  return (
    <Link
      to={`/spaces/${space.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover-lift"
    >
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <img
          src={space.photos[0]}
          alt={space.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {canUseFavorites && (
          <button
            type="button"
            aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-pressed={favorite}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={(event) => void handleFavoriteClick(event)}
            disabled={updatingFavorite}
          >
            {updatingFavorite ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  favorite ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            )}
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 font-heading font-semibold text-foreground transition-colors group-hover:text-primary">
            {space.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>
            {space.canton}, {space.province}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "h-4 w-4",
                  index < Math.floor(space.rating) ? "fill-accent text-accent" : "text-muted"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {space.rating > 0 ? space.rating.toFixed(1) : "Nuevo"} ({space.reviewCount})
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
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
