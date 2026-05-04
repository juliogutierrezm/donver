import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { BlockedDate } from "@/types";

interface AvailabilityCalendarProps {
  blockedDates: BlockedDate[];
  onBlockDatesCreate: (dates: Date[], reason: string) => Promise<void> | void;
  onRemoveBlockedDate: (id: string) => Promise<void> | void;
}

export function AvailabilityCalendar({
  blockedDates,
  onBlockDatesCreate,
  onRemoveBlockedDate,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Backend stores blocked dates as date-only strings (YYYY-MM-DD). When we deserialize them into
  // Date objects, timezone offsets can shift the day (e.g. "2026-05-10" becoming May 9 local time).
  // To avoid off-by-one rendering bugs, compare using the UTC date-only slice.
  const blockedDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const blocked of blockedDates) {
      const start = blocked.startDate instanceof Date ? blocked.startDate : new Date(blocked.startDate);
      const end = blocked.endDate instanceof Date ? blocked.endDate : new Date(blocked.endDate);

      const startKey = start.toISOString().slice(0, 10);
      const endKey = end.toISOString().slice(0, 10);

      // Current model is day-based; keep it simple and robust by filling inclusive UTC days.
      const cur = new Date(`${startKey}T00:00:00.000Z`);
      const endUtc = new Date(`${endKey}T00:00:00.000Z`);
      while (cur <= endUtc) {
        keys.add(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    return keys;
  }, [blockedDates]);

  const dateKey = (date: Date) => date.toISOString().slice(0, 10);

  const handleDayClick = (date: Date) => {
    if (selectedDates.some((d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))) {
      setSelectedDates(selectedDates.filter((d) => format(d, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0 || !reason || saving) {
      return;
    }

    setSaving(true);
    try {
      await onBlockDatesCreate([...selectedDates], reason);
      setSelectedDates([]);
      setReason("");
      setShowDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const isDateBlocked = (date: Date) => blockedDateKeys.has(dateKey(date));

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          {daysInMonth.map((date) => {
            const isBlocked = isDateBlocked(date);
            const isSelected = selectedDates.some(
              (d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            );

            return (
              <button
                key={format(date, "yyyy-MM-dd")}
                onClick={() => handleDayClick(date)}
                className={`
                  p-2 rounded text-sm font-semibold transition-colors
                  ${isBlocked ? "bg-destructive/20 text-destructive cursor-not-allowed ring-1 ring-destructive/30" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary/40" : ""}
                  ${!isBlocked && !isSelected ? "hover:bg-secondary" : ""}
                  ${!isSameMonth(date, currentMonth) ? "text-muted-foreground opacity-50" : ""}
                `}
                disabled={isBlocked}
                title={isBlocked ? "Fecha bloqueada" : undefined}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowDialog(true)} className="flex-1">
          Bloquear fechas
        </Button>
      </div>

      {/* Blocked dates list */}
      {blockedDates.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">Fechas bloqueadas</h4>
          <div className="space-y-2">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(blocked.startDate, "d MMM")} - {format(blocked.endDate, "d MMM yyyy", {
                      locale: es,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{blocked.reason}</p>
                </div>
                <button
                  onClick={() => void onRemoveBlockedDate(blocked.id)}
                  className="text-destructive hover:bg-destructive/10 rounded p-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear fechas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Fechas seleccionadas: {selectedDates.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date) => (
                    <span
                      key={format(date, "yyyy-MM-dd")}
                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                    >
                      {format(date, "d MMM")}
                    </span>
                  ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Razón del bloqueo
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Vacaciones, Mantenimiento..."
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setSelectedDates([]);
                setReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBlockDates}
              disabled={selectedDates.length === 0 || !reason || saving}
            >
              {saving ? "Guardando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
