import { Heart } from "lucide-react";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/types";

interface FavoritesTabProps {
  favorites: Space[];
}

export function FavoritesTab({ favorites }: FavoritesTabProps) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          Aún no has agregado espacios a favoritos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </div>
  );
}
