import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPetSizeLabel, getPetTypeSingularLabel } from "@/lib/pet-labels";
import type { Space, Booking, Pet } from "@/types";
import type { BookingPricingBreakdown } from "@/lib/bookingPricing";

type BookingPreview = Partial<Booking> & {
  pricing?: BookingPricingBreakdown;
  selectedPets?: Pet[];
};

interface BookingSummaryProps {
  space: Space;
  booking: BookingPreview;
  onConfirm: () => void;
  onModify: () => void;
  isLoading?: boolean;
}

export function BookingSummary({
  space,
  booking,
  onConfirm,
  onModify,
  isLoading = false,
}: BookingSummaryProps) {
  const formatDate = (date: Date) => {
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  };

  const formatTime = (time: string) => {
    return time; // Already in HH:mm format
  };

  return (
    <div className="flex h-full min-h-0 max-h-full flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
        {/* Space Image */}
        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src={space.photos[0]}
            alt={space.title}
            className="h-40 w-full object-cover"
          />
        </div>

        {/* Space Info */}
        <div>
          <h3 className="text-xl font-heading font-bold text-foreground">
            {space.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {space.canton}, {space.province}
          </p>
        </div>

        {/* Booking Details */}
        <div className="space-y-3 border-y border-border py-4">
          {booking.bookingType === "overnight" ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Fecha inicio</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.startDate && formatDate(booking.startDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Fecha fin</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.endDate && formatDate(booking.endDate)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Fecha</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.startDate && formatDate(booking.startDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Hora inicio</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.startTime && formatTime(booking.startTime)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Hora fin</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.endTime && formatTime(booking.endTime)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Duración</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.hours} horas
                </span>
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mascotas</span>
              <span className="text-right font-semibold text-foreground">
                {booking.petIds?.length || 0}
              </span>
            </div>
            {booking.selectedPets && booking.selectedPets.length > 0 && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                {booking.selectedPets.map((pet) => (
                  <p key={pet.id} className="text-foreground">
                    {pet.name} • {getPetTypeSingularLabel(pet.type)}
                    {pet.breed ? ` • ${pet.breed}` : ""}
                    {pet.size ? ` • ${getPetSizeLabel(pet.size)}` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 text-sm">
          {booking.bookingType === "hourly" ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Precio por hora</span>
                <span className="text-right font-semibold text-foreground">
                  ₡{space.pricePerHour.toLocaleString("es-CR")}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Horas seleccionadas</span>
                <span className="text-right font-semibold text-foreground">{booking.hours || 0}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal base</span>
                <span className="text-right font-semibold text-foreground">
                  ₡{booking.pricing?.baseSubtotal?.toLocaleString("es-CR") || 0}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Precio base</span>
              <span className="text-right font-semibold text-foreground">
                ₡{booking.pricing?.baseSubtotal?.toLocaleString("es-CR") || 0}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Mascotas adicionales ({Math.max((booking.petIds?.length || 1) - 1, 0)})
            </span>
            <span className="text-right font-semibold text-foreground">
              {Math.max((booking.petIds?.length || 1) - 1, 0)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Recargo mascotas adicionales ({Math.round((booking.pricing?.additionalPetRate ?? 0) * 100)}%)
            </span>
            <span className="text-right font-semibold text-foreground">
              ₡{booking.pricing?.additionalPetFee?.toLocaleString("es-CR") || 0}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-right font-semibold text-foreground">
              ₡{booking.subtotal?.toLocaleString("es-CR") || 0}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Comisión Donver (10%)</span>
            <span className="text-right font-semibold text-foreground">
              ₡{booking.serviceFee?.toLocaleString("es-CR") || 0}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-right text-lg font-bold text-primary">
              ₡{booking.totalPrice?.toLocaleString("es-CR") || 0}
            </span>
          </div>
        </div>

        <div className="flex gap-2 rounded-lg border border-accent/20 bg-accent/10 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-foreground" />
          <p className="text-sm text-accent-foreground">
            Puedes cancelar gratis hasta 24 horas antes de la reserva.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-6 py-4">
        <div className="flex gap-3">
        <Button
          onClick={onModify}
          variant="outline"
          className="flex-1"
          disabled={isLoading}
        >
          Modificar
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Confirmando..." : "Confirmar Reservación"}
        </Button>
        </div>
      </div>
    </div>
  );
}
