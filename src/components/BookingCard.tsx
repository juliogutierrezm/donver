import { useEffect, useMemo, useState } from "react";
import { format, addDays, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPetSizeLabel, getPetTypeSingularLabel } from "@/lib/pet-labels";
import type { Space, BlockedDate, Pet } from "@/types";
import { calculateBookingPricing, DEFAULT_ADDITIONAL_PET_RATE } from "@/lib/bookingPricing";

interface BookingCardProps {
  space: Space;
  blockedDates: BlockedDate[];
  pets: Pet[];
  onBookingSummary: (booking: any) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  `${String(index).padStart(2, "0")}:00`
);

function getHourNumber(time: string) {
  const [hours, minutes] = time.split(":");
  if (minutes !== "00") return Number.NaN;
  return Number(hours);
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

  const endTimeOptions = useMemo(
    () => HOUR_OPTIONS.filter((option) => getHourNumber(option) > getHourNumber(startTime)),
    [startTime]
  );

  useEffect(() => {
    if (bookingType === "hourly" && endTime && !endTimeOptions.includes(endTime)) {
      setEndTime("");
    }
  }, [bookingType, endTime, endTimeOptions]);

  const selectedHours = useMemo(() => {
    const startHour = getHourNumber(startTime);
    const endHour = getHourNumber(endTime);
    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) {
      return 0;
    }
    return endHour - startHour;
  }, [endTime, startTime]);

  const hourlyValidationMessage = useMemo(() => {
    if (bookingType !== "hourly") return "";
    if (!startTime || !endTime) {
      return "Selecciona una hora de inicio y una hora de fin.";
    }
    if (!startTime.endsWith(":00") || !endTime.endsWith(":00")) {
      return "Solo puedes seleccionar horas cerradas.";
    }
    if (selectedHours <= 0) {
      return "La hora de fin debe ser posterior a la hora de inicio.";
    }
    if (selectedHours < space.minHours) {
      return `Este espacio requiere un mínimo de ${space.minHours} horas.`;
    }
    return "";
  }, [bookingType, endTime, selectedHours, space.minHours, startTime]);

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
    if (bookingType === "hourly" && hourlyValidationMessage) {
      return {
        unitCount: 0,
        baseSubtotal: 0,
        additionalPetFee: 0,
        subtotal: 0,
        serviceFee: 0,
        total: 0,
        additionalPetRate: DEFAULT_ADDITIONAL_PET_RATE,
      };
    }

    return calculateBookingPricing({
      bookingType,
      startDate: parse(startDate, "yyyy-MM-dd", new Date()),
      endDate:
        bookingType === "overnight"
          ? parse(endDate, "yyyy-MM-dd", new Date())
          : parse(startDate, "yyyy-MM-dd", new Date()),
      hours: bookingType === "hourly" ? selectedHours : undefined,
      pricePerNight: space.pricePerNight,
      pricePerHour: space.pricePerHour,
      petCount: Math.max(selectedPetIds.length, 1),
      additionalPetRate: DEFAULT_ADDITIONAL_PET_RATE,
    });
  }, [
    bookingType,
    endDate,
    hourlyValidationMessage,
    selectedHours,
    selectedPetIds.length,
    space.pricePerHour,
    space.pricePerNight,
    startDate,
  ]);

  const isBookingDisabled =
    selectedPetIds.length === 0 || (bookingType === "hourly" && Boolean(hourlyValidationMessage));

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

    if (bookingType === "hourly" && hourlyValidationMessage) {
      toast({
        title: "Horario inválido",
        description: hourlyValidationMessage,
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
      hours: bookingType === "hourly" ? selectedHours : undefined,
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
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {HOUR_OPTIONS.map((timeOption) => (
                    <option key={timeOption} value={timeOption}>
                      {timeOption}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Hora fin
                </label>
                <select
                  value={endTimeOptions.includes(endTime) ? endTime : ""}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    Selecciona una hora
                  </option>
                  {endTimeOptions.map((timeOption) => (
                    <option key={timeOption} value={timeOption}>
                      {timeOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Horas seleccionadas</span>
                <span className="font-semibold text-foreground">
                  {selectedHours > 0 ? `${selectedHours} ${selectedHours === 1 ? "hora" : "horas"}` : "0 horas"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Este espacio requiere un mínimo de {space.minHours} horas.
              </p>
            </div>
            {hourlyValidationMessage && (
              <p className="text-sm font-medium text-destructive">{hourlyValidationMessage}</p>
            )}
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
        <p className="text-sm text-muted-foreground">
          {selectedPetIds.length} de {space.maxPets} mascotas seleccionadas para esta reserva.
        </p>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 pt-4 border-t border-border">
        {bookingType === "hourly" ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio por hora</span>
              <span className="font-semibold text-foreground">
                ₡{space.pricePerHour.toLocaleString("es-CR")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Horas seleccionadas</span>
              <span className="font-semibold text-foreground">
                {selectedHours > 0 ? selectedHours : 0}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Precio base</span>
            <span className="font-semibold text-foreground">
              ₡{priceBreakdown.baseSubtotal.toLocaleString("es-CR")}
            </span>
          </div>
        )}
        {bookingType === "hourly" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal base</span>
            <span className="font-semibold text-foreground">
              ₡{priceBreakdown.baseSubtotal.toLocaleString("es-CR")}
            </span>
          </div>
        )}
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
        disabled={isBookingDisabled}
      >
        Solicitar Reserva
      </Button>
    </div>
  );
}
