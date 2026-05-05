import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import {
  availabilityApi,
  bookingsApi,
  getAuthSession,
  getCurrentUserId,
  petsApi,
  reviewsApi,
  spacesApi,
} from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { BookingPricingBreakdown } from "@/lib/bookingPricing";
import type { BlockedDate, Booking, Pet, Review, Space } from "@/types";

type BookingPreview = Partial<Booking> & {
  pricing?: BookingPricingBreakdown;
  selectedPets?: Pet[];
};

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [space, setSpace] = useState<Space | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingSummaryOpen, setBookingSummaryOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingPreview | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const spaceId = id;
    let cancelled = false;

    async function load() {
      try {
        const session = getAuthSession();
        const [spaceData, blockedData, reviewData, petData] = await Promise.all([
          spacesApi.getById(spaceId),
          availabilityApi.list(spaceId),
          reviewsApi.listForSpace(spaceId),
          session ? petsApi.listMine() : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setSpace(spaceData);
        setBlockedDates(blockedData);
        setReviews(reviewData);
        setPets(petData);
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "No se pudo cargar el espacio",
          description:
            error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
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

  if (!space) {
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
              El espacio que buscas no existe o no se pudo cargar.
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

              <div className="grid grid-cols-3 gap-4 p-6 bg-card border border-border rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{space.acceptedPetTypes.length}</p>
                  <p className="text-sm text-muted-foreground">Tipos de mascotas</p>
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

              <SpaceAmenities amenities={space.amenities} />
              <SpaceReviews reviews={reviews} />
            </div>

            <div>
              <BookingCard
                space={space}
                blockedDates={blockedDates}
                pets={pets}
                onBookingSummary={handleBookingSummary}
              />
            </div>
          </div>
        </div>
      </main>

      <Dialog open={bookingSummaryOpen} onOpenChange={setBookingSummaryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
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
