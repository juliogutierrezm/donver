import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import type { Booking } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BookingsTabProps {
  bookings: Booking[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export function BookingsTab({ bookings }: BookingsTabProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No tienes reservaciones aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        return (
          <div
            key={booking.id}
            className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {booking.spaceName ?? "Espacio Donver"}
                </h3>
                {booking.caregiverName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Cuidador: {booking.caregiverName}
                  </p>
                )}
              </div>
              <Badge className={statusColors[booking.status]}>
                {statusLabels[booking.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-semibold text-foreground text-sm">
                  {format(booking.startDate, "d MMM", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="font-semibold text-foreground text-sm">
                  {booking.bookingType === "overnight"
                    ? `${Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24))} noches`
                    : `${booking.hours}h`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mascotas</p>
                <p className="font-semibold text-foreground text-sm">
                  {booking.petIds.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold text-primary flex items-center gap-1 text-sm">
                  <DollarSign className="w-3 h-3" />
                  {booking.totalPrice.toLocaleString("es-CR")}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button asChild variant="link" className="h-auto px-0 text-sm font-semibold">
                <Link to={`/bookings/${booking.id}`}>Ver detalles</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
