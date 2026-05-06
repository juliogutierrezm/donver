import { useEffect, useMemo, useState } from "react";
import { format, addDays, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPetSizeHelp, getPetSizeLabel, getPetTypeSingularLabel } from "@/lib/pet-labels";
import type { Space, BlockedDate, Pet } from "@/types";
import { calculateBookingPricing, DEFAULT_ADDITIONAL_PET_RATE } from "@/lib/bookingPricing";

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
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const eligiblePets = useMemo(
    () =>
      pets.filter(
        (pet) =>
          space.acceptedPetTypes.includes(pet.type) &&
          space.acceptedPetSizes.includes(pet.size)
      ),
    [pets, space.acceptedPetSizes, space.acceptedPetTypes]
  );

  useEffect(() => {
    const eligibleIds = new Set(eligiblePets.map((pet) => pet.id));
    setSelectedPetIds((current) => {
      const filtered = current.filter((id) => eligibleIds.has(id)).slice(0, space.maxPets);
      if (filtered.length > 0 || eligiblePets.length === 0) return filtered;
      return [eligiblePets[0].id];
    });
  }, [eligiblePets, space.maxPets]);

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
    return calculateBookingPricing({
      bookingType,
      startDate: parse(startDate, "yyyy-MM-dd", new Date()),
      endDate:
        bookingType === "overnight"
          ? parse(endDate, "yyyy-MM-dd", new Date())
          : parse(startDate, "yyyy-MM-dd", new Date()),
      hours,
      pricePerNight: space.pricePerNight,
      pricePerHour: space.pricePerHour,
      petCount: Math.max(selectedPetIds.length, 1),
      additionalPetRate: DEFAULT_ADDITIONAL_PET_RATE,
    });
  }, [bookingType, endDate, hours, selectedPetIds.length, space.pricePerHour, space.pricePerNight, startDate]);

  const handlePetToggle = (petId: string) => {
    setSelectedPetIds((current) => {
      if (current.includes(petId)) {
        return current.filter((id) => id !== petId);
      }
      if (current.length >= space.maxPets) {
        toast({
          title: "Límite de mascotas alcanzado",
          description: `Este espacio permite máximo ${space.maxPets} mascotas por reserva.`,
          variant: "destructive",
        });
        return current;
      }
      return [...current, petId];
    });
  };

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

    if (selectedPetIds.length === 0) {
      toast({
        title: "Selecciona al menos una mascota",
        description: "Debes elegir la mascota o mascotas para esta reserva.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPetIds.length > space.maxPets) {
      toast({
        title: "Demasiadas mascotas",
        description: `Este espacio permite máximo ${space.maxPets} mascotas por reserva.`,
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
      petIds: selectedPetIds,
      subtotal: priceBreakdown.subtotal,
      serviceFee: priceBreakdown.serviceFee,
      totalPrice: priceBreakdown.total,
      pricing: priceBreakdown,
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
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Mascotas para la reserva (máx {space.maxPets})
          </label>
          {eligiblePets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No tienes mascotas compatibles registradas para este espacio.
            </div>
          ) : (
            <div className="space-y-2">
              {eligiblePets.map((pet) => (
                <label
                  key={pet.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedPetIds.includes(pet.id)}
                    onChange={() => handlePetToggle(pet.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold text-foreground">{pet.name}</span>
                    <span className="text-muted-foreground">
                      {getPetTypeSingularLabel(pet.type)}
                      {pet.breed ? ` • ${pet.breed}` : ""}
                      {pet.size ? ` • ${getPetSizeLabel(pet.size)}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Guía rápida de tamaños</p>
          <p className="mt-1">{getPetSizeLabel("small")}: {getPetSizeHelp("small")}</p>
          <p className="mt-1">{getPetSizeLabel("medium")}: {getPetSizeHelp("medium")}</p>
          <p className="mt-1">{getPetSizeLabel("large")}: {getPetSizeHelp("large")}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedPetIds.length} de {space.maxPets} mascotas seleccionadas para esta reserva.
        </p>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Precio base</span>
          <span className="font-semibold text-foreground">
            ₡{priceBreakdown.baseSubtotal.toLocaleString("es-CR")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Mascotas adicionales ({Math.max(selectedPetIds.length - 1, 0)})
          </span>
          <span className="font-semibold text-foreground">
            {Math.max(selectedPetIds.length - 1, 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Recargo mascotas adicionales ({Math.round(priceBreakdown.additionalPetRate * 100)}%)
          </span>
          <span className="font-semibold text-foreground">
            ₡{priceBreakdown.additionalPetFee.toLocaleString("es-CR")}
          </span>
        </div>
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
