import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SpaceGallery } from "@/components/SpaceGallery";
import { SpaceAmenities } from "@/components/SpaceAmenities";
import { SpaceReviews } from "@/components/SpaceReviews";
import { BookingCard } from "@/components/BookingCard";
import { BookingSummary } from "@/components/BookingSummary";
import { Badge } from "@/components/ui/badge";
import { getPetSizeHelp, getPetSizeLabel, getPetTypeLabel } from "@/lib/pet-labels";
import {
  ApiError,
  authApi,
  availabilityApi,
  bookingsApi,
  getAuthSession,
  getCurrentUserId,
  petsApi,
  reviewsApi,
  spacesApi,
} from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { APP_ROUTES } from "@/lib/routes";
import type { BookingPricingBreakdown } from "@/lib/bookingPricing";
import type { BlockedDate, Booking, Pet, Review, Space } from "@/types";

type BookingPreview = Partial<Booking> & {
  pricing?: BookingPricingBreakdown;
  selectedPets?: Pet[];
};
type ViewState = "loading" | "ready" | "not-found" | "error";

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [space, setSpace] = useState<Space | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingSummaryOpen, setBookingSummaryOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingPreview | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [sessionUser, setSessionUser] = useState(() => getAuthSession()?.user ?? null);
  const isCaregiverOnly = Boolean(
    sessionUser?.roles.includes("caregiver") && !sessionUser.roles.includes("owner")
  );
  const isBothInCaregiverView = Boolean(
    sessionUser?.roles.includes("caregiver") &&
      sessionUser.roles.includes("owner") &&
      sessionUser.activeRole === "caregiver"
  );
  const canReserveByRole =
    !sessionUser ||
    (sessionUser.roles.includes("owner") && (!sessionUser.roles.includes("caregiver") || sessionUser.activeRole !== "caregiver"));
  const isOwnSpace = Boolean(space && sessionUser && space.caregiverId === sessionUser.id);

  useEffect(() => {
    if (!id) {
      setViewState("not-found");
      return;
    }
    const spaceId = id;
    let cancelled = false;

    async function load() {
      setViewState("loading");
      setErrorMessage("");
      try {
        const session = getAuthSession();
        if (!cancelled) {
          setSessionUser(session?.user ?? null);
        }
        const [spaceData, blockedData, reviewData, petData] = await Promise.all([
          spacesApi.getById(spaceId),
          availabilityApi.list(spaceId),
          reviewsApi.listForSpace(spaceId),
          session?.user.roles.includes("owner") ? petsApi.listMine() : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setSpace(spaceData);
        setBlockedDates(blockedData);
        setReviews(reviewData);
        setPets(petData);
        setViewState("ready");
      } catch (error) {
        if (cancelled) return;
        if (
          (error instanceof ApiError && error.status === 404) ||
          (error instanceof Error && error.message.toLowerCase().includes("no encontrado"))
        ) {
          setViewState("not-found");
          return;
        }
        const message =
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.";
        setErrorMessage(message);
        setViewState("error");
        toast({
          title: "No se pudo cargar el espacio",
          description: message,
          variant: "destructive",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const handleBookingSummary = (booking: BookingPreview) => {
    const selectedPets = pets.filter((pet) => (booking.petIds ?? []).includes(pet.id));
    setBookingData({ ...booking, selectedPets });
    setBookingSummaryOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!bookingData?.spaceId || !bookingData.startDate || !bookingData.endDate) {
      return;
    }

    if (!canReserveByRole) {
      toast({
        title: "No puedes reservar en esta vista",
        description: "Para reservar necesitas activar tu perfil como dueño.",
        variant: "destructive",
      });
      return;
    }

    if (isOwnSpace) {
      toast({
        title: "No puedes reservar este espacio",
        description: "No puedes reservar tu propio espacio.",
        variant: "destructive",
      });
      return;
    }

    setConfirmingBooking(true);
    try {
      await bookingsApi.create({
        spaceId: bookingData.spaceId,
        ownerId: getCurrentUserId(),
        petIds: bookingData.petIds ?? [],
        bookingType: bookingData.bookingType ?? "overnight",
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        hours: bookingData.hours,
        subtotal: bookingData.subtotal ?? 0,
        serviceFee: bookingData.serviceFee ?? 0,
        totalPrice: bookingData.totalPrice ?? 0,
        notes: bookingData.notes,
      });
      setBookingSummaryOpen(false);
      toast({
        title: "Reservación creada",
        description: "Tu solicitud fue enviada correctamente.",
      });
    } catch (error) {
      toast({
        title: "No se pudo crear la reservación",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setConfirmingBooking(false);
    }
  };

  const handleSwitchToOwnerView = async () => {
    try {
      const updatedUser = await authApi.updateProfile({ activeRole: "owner" });
      setSessionUser(updatedUser);
      toast({
        title: "Vista de dueño activada",
        description: "Ahora puedes continuar con la reservación.",
      });
    } catch (error) {
      toast({
        title: "No se pudo cambiar la vista",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    }
  };

  if (viewState === "loading") {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4 animate-pulse" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Cargando espacio...
            </h1>
            <p className="text-muted-foreground">
              Estamos preparando los detalles del espacio para ti.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (viewState === "not-found" || (viewState === "ready" && !space)) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Espacio no encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              El espacio que buscas no existe o ya no está disponible.
            </p>
            <a href="/spaces" className="text-primary hover:underline font-semibold">
              Volver a la búsqueda
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (viewState === "error") {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              No se pudo cargar el espacio
            </h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage || "Intenta nuevamente en unos minutos."}
            </p>
            <a href="/spaces" className="text-primary hover:underline font-semibold">
              Volver a la búsqueda
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!space) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <SpaceGallery photos={space.photos} title={space.title} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
                  {space.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  📍 {space.canton}, {space.province}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xl">⭐</span>
                  <span className="font-semibold text-foreground">{space.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({space.reviewCount} reseñas)</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
                  Acerca de este espacio
                </h2>
                <p className="text-foreground leading-relaxed">{space.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground">Tipos aceptados</p>
                  <p className="mt-2 text-sm font-bold text-foreground">
                    {space.acceptedPetTypes.length > 0
                      ? space.acceptedPetTypes.map((type) => getPetTypeLabel(type)).join(", ")
                      : "No definidos"}
                  </p>
                </div>
                <div className="text-center border-l border-r border-border">
                  <p className="text-2xl font-bold text-primary">{space.maxPets}</p>
                  <p className="text-sm text-muted-foreground">Mascotas máximo</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    ₡{space.pricePerHour.toLocaleString("es-CR")}
                  </p>
                  <p className="text-sm text-muted-foreground">Por hora</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
                  Mascotas aceptadas
                </h2>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tipos aceptados</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {space.acceptedPetTypes.length > 0 ? (
                        space.acceptedPetTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="px-3 py-1 text-sm">
                            {getPetTypeLabel(type)}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Este espacio no ha definido tipos de mascotas aceptadas.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tamaños aceptados</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {space.acceptedPetSizes.length > 0 ? (
                        space.acceptedPetSizes.map((size) => (
                          <Badge key={size} variant="outline" className="px-3 py-1 text-sm">
                            {getPetSizeLabel(size)}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Este espacio no ha definido tamaños aceptados.
                        </p>
                      )}
                    </div>
                    {space.acceptedPetSizes.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                        {space.acceptedPetSizes.map((size) => (
                          <p key={size}>
                            <span className="font-medium text-foreground">{getPetSizeLabel(size)}:</span>{" "}
                            {getPetSizeHelp(size)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <SpaceAmenities amenities={space.amenities} />
              <SpaceReviews reviews={reviews} />
            </div>

            <div>
              {isOwnSpace ? (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">Este espacio es tuyo</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Este es tu espacio publicado. Puedes gestionarlo desde tu dashboard.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    onClick={() => navigate(APP_ROUTES.caregiverDashboard)}
                  >
                    Ir al dashboard
                  </button>
                </div>
              ) : isCaregiverOnly ? (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">No puedes reservar todavía</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Para reservar necesitas activar tu perfil como dueño.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    onClick={() => navigate(APP_ROUTES.becomeOwner)}
                  >
                    Activar perfil de dueño
                  </button>
                </div>
              ) : isBothInCaregiverView ? (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">Cambia a vista de dueño</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cambia a tu vista de dueño para reservar este espacio.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    onClick={() => void handleSwitchToOwnerView()}
                  >
                    Cambiar a vista dueño
                  </button>
                </div>
              ) : (
                <BookingCard
                  space={space}
                  blockedDates={blockedDates}
                  pets={pets}
                  onBookingSummary={handleBookingSummary}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={bookingSummaryOpen} onOpenChange={setBookingSummaryOpen}>
        <DialogContent className="flex max-h-[90vh] min-h-0 w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Resumen de la reservación</DialogTitle>
          </DialogHeader>
          {bookingData && (
            <BookingSummary
              space={space}
              booking={bookingData}
              onConfirm={() => void handleConfirmBooking()}
              onModify={() => setBookingSummaryOpen(false)}
              isLoading={confirmingBooking}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}
