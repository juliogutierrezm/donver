import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Review } from "@/types";

interface SpaceReviewsProps {
  reviews: Review[];
}

export function SpaceReviews({ reviews }: SpaceReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-heading font-bold text-foreground">
          Reseñas
        </h3>
        <p className="text-muted-foreground">
          Aún no hay reseñas para este espacio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-heading font-bold text-foreground">
        Reseñas ({reviews.length})
      </h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 border border-border rounded-lg bg-background"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {review.ownerId.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {review.ownerId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-accent text-accent"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-foreground leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
