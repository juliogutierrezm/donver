import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6 max-w-md mx-auto">
      {/* Space Image */}
      <div className="rounded-lg overflow-hidden border border-border">
        <img
          src={space.photos[0]}
          alt={space.title}
          className="w-full h-40 object-cover"
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
      <div className="space-y-3 border-t border-b border-border py-4">
        {booking.bookingType === "overnight" ? (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha inicio</span>
              <span className="font-semibold text-foreground">
                {booking.startDate && formatDate(booking.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha fin</span>
              <span className="font-semibold text-foreground">
                {booking.endDate && formatDate(booking.endDate)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-semibold text-foreground">
                {booking.startDate && formatDate(booking.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora inicio</span>
              <span className="font-semibold text-foreground">
                {booking.startTime && formatTime(booking.startTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora fin</span>
              <span className="font-semibold text-foreground">
                {booking.endTime && formatTime(booking.endTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración</span>
              <span className="font-semibold text-foreground">
                {booking.hours} horas
              </span>
            </div>
          </>
        )}

        {/* Pets */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mascotas</span>
            <span className="font-semibold text-foreground">
              {booking.petIds?.length || 0}
            </span>
          </div>
          {booking.selectedPets && booking.selectedPets.length > 0 && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              {booking.selectedPets.map((pet) => (
                <p key={pet.id} className="text-foreground">
                  {pet.name} • {pet.type}
                  {pet.breed ? ` • ${pet.breed}` : ""}
                  {pet.size ? ` • ${pet.size}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Precio base</span>
          <span className="font-semibold text-foreground">
            ₡{booking.pricing?.baseSubtotal?.toLocaleString("es-CR") || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Mascotas adicionales ({Math.max((booking.petIds?.length || 1) - 1, 0)})
          </span>
          <span className="font-semibold text-foreground">
            {Math.max((booking.petIds?.length || 1) - 1, 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Recargo mascotas adicionales ({Math.round((booking.pricing?.additionalPetRate ?? 0) * 100)}%)
          </span>
          <span className="font-semibold text-foreground">
            ₡{booking.pricing?.additionalPetFee?.toLocaleString("es-CR") || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold text-foreground">
            ₡{booking.subtotal?.toLocaleString("es-CR") || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Comisión Donver (10%)</span>
          <span className="font-semibold text-foreground">
            ₡{booking.serviceFee?.toLocaleString("es-CR") || 0}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-bold text-primary text-lg">
            ₡{booking.totalPrice?.toLocaleString("es-CR") || 0}
          </span>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="flex gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
        <AlertCircle className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-accent-foreground">
          Puedes cancelar gratis hasta 24 horas antes de la reserva.
        </p>
      </div>

      {/* Action Buttons */}
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
  );
}
