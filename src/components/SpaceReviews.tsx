import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star } from "lucide-react";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";

interface SpaceReviewsProps {
  reviews: Review[];
}

export function SpaceReviews({ reviews }: SpaceReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-heading font-bold text-foreground">Reseñas</h3>
        <p className="text-muted-foreground">Aún no hay reseñas para este espacio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-heading font-bold text-foreground">Reseñas</h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? "experiencia compartida" : "experiencias compartidas"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-sm font-bold text-primary">
                    {review.reviewerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{review.reviewerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "d 'de' MMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4",
                      index < review.rating ? "fill-accent text-accent" : "text-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {review.comment ? (
              <p className="leading-relaxed text-foreground">{review.comment}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Esta reseña no incluye comentario adicional.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
