import { useState, useMemo } from "react";
import { format, addDays, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Space, BlockedDate, Pet } from "@/types";

interface BookingCardProps {
  space: Space;
  blockedDates: BlockedDate[];
  pets: Pet[];
  onBookingSummary: (booking: any) => void;
}

export function BookingCard({
  space,
  blockedDates,
  pets,
  onBookingSummary,
}: BookingCardProps) {
  const { toast } = useToast();
  const [bookingType, setBookingType] = useState<"hourly" | "overnight">(
    "overnight"
  );
  const [startDate, setStartDate] = useState(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(addDays(new Date(), 2), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("16:00");
  const [hours, setHours] = useState(space.minHours);
  const [selectedPetType, setSelectedPetType] = useState(
    space.acceptedPetTypes[0] || "dog"
  );
  const [petCount, setPetCount] = useState(1);

  const blockedDateStrings = useMemo(
    () => {
      const dates = new Set<string>();
      blockedDates.forEach((d) => {
        const start = new Date(d.startDate);
        const end = new Date(d.endDate);
        for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
          dates.add(format(new Date(cur), "yyyy-MM-dd"));
        }
      });
      return dates;
    },
    [blockedDates]
  );

  // Check if a date or date range has blocked dates
  const hasBlockedDates = (start: string, end?: string) => {
    const startD = parse(start, "yyyy-MM-dd", new Date());
    if (!end) return blockedDateStrings.has(start);

    const endD = parse(end, "yyyy-MM-dd", new Date());
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      if (blockedDateStrings.has(format(d, "yyyy-MM-dd"))) {
        return true;
      }
    }
    return false;
  };

  // Calculate price
  const priceBreakdown = useMemo(() => {
    if (bookingType === "overnight") {
      const startD = parse(startDate, "yyyy-MM-dd", new Date());
      const endD = parse(endDate, "yyyy-MM-dd", new Date());
      const nights = Math.max(1, Math.floor((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
      const subtotal = space.pricePerNight * nights;
      const serviceFee = Math.floor(subtotal * 0.1);
      return { nights, subtotal, serviceFee, total: subtotal + serviceFee };
    } else {
      const subtotal = space.pricePerHour * hours;
      const serviceFee = Math.floor(subtotal * 0.1);
      return { hours, subtotal, serviceFee, total: subtotal + serviceFee };
    }
  }, [bookingType, startDate, endDate, hours, space.pricePerNight, space.pricePerHour]);

  const handleRequestBooking = () => {
    // Validate blocked dates
    if (bookingType === "overnight" && hasBlockedDates(startDate, endDate)) {
      toast({
        title: "Fechas no disponibles",
        description:
          "El rango de fechas seleccionado contiene fechas bloqueadas.",
        variant: "destructive",
      });
      return;
    }

    if (bookingType === "hourly" && hasBlockedDates(startDate)) {
      toast({
        title: "Fecha no disponible",
        description: "La fecha seleccionada está bloqueada.",
        variant: "destructive",
      });
      return;
    }

    // Validate pet count
    if (petCount > space.maxPets) {
      toast({
        title: "Demasiadas mascotas",
        description: `Este espacio acepta máximo ${space.maxPets} mascotas.`,
        variant: "destructive",
      });
      return;
    }

    // Create booking object
    const booking = {
      spaceId: space.id,
      bookingType,
      startDate: parse(startDate, "yyyy-MM-dd", new Date()),
      endDate:
        bookingType === "overnight"
          ? parse(endDate, "yyyy-MM-dd", new Date())
          : parse(startDate, "yyyy-MM-dd", new Date()),
      startTime: bookingType === "hourly" ? startTime : undefined,
      endTime: bookingType === "hourly" ? endTime : undefined,
      hours: bookingType === "hourly" ? hours : undefined,
      petIds: Array(petCount).fill(selectedPetType), // Mock pet IDs
      subtotal: priceBreakdown.subtotal,
      serviceFee: priceBreakdown.serviceFee,
      totalPrice: priceBreakdown.total,
    };

    onBookingSummary(booking);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
      {/* Rating and Price */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className="text-xl">⭐</span>
            <span className="font-semibold text-foreground">
              {space.rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({space.reviewCount} reseñas)
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            ₡{space.pricePerNight.toLocaleString("es-CR")}
          </span>
          <span className="text-muted-foreground">por noche</span>
        </div>
      </div>

      {/* Booking Type Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setBookingType("overnight")}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            bookingType === "overnight"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Por noche
        </button>
        <button
          onClick={() => setBookingType("hourly")}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            bookingType === "hourly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Por hora
        </button>
      </div>

      {/* Dates and Times */}
      <div className="space-y-3">
        {bookingType === "overnight" ? (
          <>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Fecha
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Hora fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Duración (mínimo {space.minHours}h)
              </label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(Math.max(space.minHours, Number(e.target.value)))}
                min={space.minHours}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* Pets */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Tipo
            </label>
            <select
              value={selectedPetType}
              onChange={(e) => setSelectedPetType(e.target.value as any)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {space.acceptedPetTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "dog"
                    ? "Perro"
                    : type === "cat"
                      ? "Gato"
                      : type === "bird"
                        ? "Pájaro"
                        : "Otro"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">
              Cantidad (máx {space.maxPets})
            </label>
            <input
              type="number"
              value={petCount}
              onChange={(e) => setPetCount(Math.min(space.maxPets, Number(e.target.value)))}
              min={1}
              max={space.maxPets}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold text-foreground">
            ₡{priceBreakdown.subtotal.toLocaleString("es-CR")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Comisión (10%)</span>
          <span className="font-semibold text-foreground">
            ₡{priceBreakdown.serviceFee.toLocaleString("es-CR")}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
          <span>Total</span>
          <span className="text-primary">
            ₡{priceBreakdown.total.toLocaleString("es-CR")}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleRequestBooking}
        size="lg"
        className="w-full rounded-lg"
      >
        Solicitar Reservación
      </Button>
    </div>
  );
}
