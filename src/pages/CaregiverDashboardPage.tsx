import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SpaceFormDialog } from "@/components/caregiver/SpaceFormDialog";
import { AvailabilityCalendar } from "@/components/caregiver/AvailabilityCalendar";
import { CaregiverStatusBanner } from "@/components/profile/CaregiverStatusBanner";
import { authApi, availabilityApi, bookingsApi, spacesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { BlockedDate, Booking, Space, User } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export default function CaregiverDashboardPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [blockedDates, setBlockedDates] = useState<Record<string, BlockedDate[]>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>();
  const [expandedSpace, setExpandedSpace] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingData(true);
      try {
        const currentUser = await authApi.getCurrentUser();
        if (cancelled) return;

        if (!currentUser.roles.includes("caregiver")) {
          toast({
            title: "Completa tu perfil de cuidador",
            description: "Debes terminar tu onboarding antes de usar este dashboard.",
            variant: "destructive",
          });
          navigate("/become-caregiver", { replace: true });
          return;
        }

        const [currentSpaces, currentBookings] = await Promise.all([
          spacesApi.getMine(),
          bookingsApi.listCaregiver(),
        ]);
        if (cancelled) return;

        setUser(currentUser);
        setSpaces(currentSpaces);
        setIncomingBookings(currentBookings);

        const blockedEntries = await Promise.all(
          currentSpaces.map(async (space) => {
            if (!space.isActive) {
              return [space.id, []] as const;
            }

            try {
              return [space.id, await availabilityApi.list(space.id)] as const;
            } catch {
              return [space.id, []] as const;
            }
          })
        );
        if (cancelled) return;
        setBlockedDates(Object.fromEntries(blockedEntries));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message.toLowerCase().includes("sesion")) {
          navigate("/login?next=%2Fcaregiver%2Fdashboard", { replace: true });
          return;
        }
        toast({
          title: "No se pudo cargar el dashboard",
          description:
            error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  const handleOpenAdd = () => {
    setSelectedSpace(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (space: Space) => {
    setSelectedSpace(space);
    setFormOpen(true);
  };

  const handleSaveSpace = async (spaceData: Partial<Space>) => {
    try {
      if (selectedSpace) {
        const updated = await spacesApi.update(selectedSpace.id, spaceData);
        setSpaces((currentSpaces) =>
          currentSpaces.map((space) => (space.id === updated.id ? updated : space))
        );
      } else {
        if (
          !spaceData.title ||
          !spaceData.description ||
          !spaceData.province ||
          !spaceData.canton ||
          !spaceData.address ||
          spaceData.latitude === undefined ||
          spaceData.longitude === undefined
        ) {
          throw new Error("Completa la ubicación del espacio antes de guardarlo.");
        }

        const created = await spacesApi.create({
          caregiverId: user?.id ?? "",
          title: spaceData.title,
          description: spaceData.description,
          photos: spaceData.photos ?? [],
          province: spaceData.province,
          canton: spaceData.canton,
          district: spaceData.district,
          address: spaceData.address,
          formattedAddress: spaceData.formattedAddress,
          latitude: spaceData.latitude,
          longitude: spaceData.longitude,
          pricePerNight: spaceData.pricePerNight ?? 0,
          pricePerHour: spaceData.pricePerHour ?? 0,
          minHours: spaceData.minHours ?? 1,
          acceptedPetTypes: spaceData.acceptedPetTypes ?? [],
          acceptedPetSizes: spaceData.acceptedPetSizes ?? [],
          maxPets: spaceData.maxPets ?? 1,
          amenities: spaceData.amenities ?? [],
          isActive: false,
        });
        setSpaces((currentSpaces) => [created, ...currentSpaces]);
        setBlockedDates((currentBlocked) => ({ ...currentBlocked, [created.id]: [] }));
      }

      setUser(await authApi.getCurrentUser());

      setFormOpen(false);
      toast({
        title: selectedSpace ? "Espacio actualizado" : "Borrador guardado",
        description: selectedSpace
          ? "Los cambios se guardaron correctamente."
          : "Tu espacio quedó guardado como borrador.",
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar el espacio",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    }
  };

  const handleToggleSpaceStatus = async (space: Space, nextActive: boolean) => {
    try {
      const updated = await spacesApi.update(space.id, { isActive: nextActive });
      setSpaces((currentSpaces) =>
        currentSpaces.map((item) => (item.id === updated.id ? updated : item))
      );
      setUser(await authApi.getCurrentUser());
      toast({
        title: nextActive ? "Espacio publicado" : "Espacio desactivado",
        description: nextActive
          ? "Tu espacio ya aparece en la vista pública."
          : "El espacio ya no aparecerá como disponible.",
      });
    } catch (error) {
      toast({
        title: nextActive ? "No se pudo publicar el espacio" : "No se pudo desactivar el espacio",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    }
  };

  const handleBlockDatesCreate = async (spaceId: string, dates: Date[], reason: string) => {
    try {
      const created = await Promise.all(
        dates
          .slice()
          .sort((a, b) => a.getTime() - b.getTime())
          .map((date) =>
            availabilityApi.blockDates({
              spaceId,
              startDate: date,
              endDate: date,
              reason,
            })
          )
      );
      setBlockedDates((currentBlocked) => ({
        ...currentBlocked,
        [spaceId]: [...(currentBlocked[spaceId] ?? []), ...created].sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime()
        ),
      }));
      toast({
        title: "Fechas bloqueadas",
        description: "La disponibilidad se actualizó correctamente.",
      });
    } catch (error) {
      toast({
        title: "No se pudieron bloquear las fechas",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBlockedDate = async (spaceId: string, dateId: string) => {
    try {
      await availabilityApi.unblockDate(dateId, spaceId);
      setBlockedDates((currentBlocked) => ({
        ...currentBlocked,
        [spaceId]: (currentBlocked[spaceId] ?? []).filter((date) => date.id !== dateId),
      }));
    } catch (error) {
      toast({
        title: "No se pudo eliminar el bloqueo",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold text-foreground">
                Dashboard de cuidador
              </h1>
              <p className="mt-2 text-muted-foreground">
                Gestiona tu perfil, tus espacios y la disponibilidad.
              </p>
            </div>
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo espacio
            </Button>
          </div>

          <div className="mb-8">
            <CaregiverStatusBanner user={user} onCreateSpace={handleOpenAdd} />
          </div>

          <div className="mb-12 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {spaces.length > 0
                          ? (
                              spaces.reduce((sum, space) => sum + space.rating, 0) / spaces.length
                            ).toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({spaces.reduce((sum, space) => sum + space.reviewCount, 0)} reseñas)
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {user.caregiverStatus?.operationalReady ? "Cuenta operativa" : "Configuración pendiente"}
              </div>
            </div>
          </div>

          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Mis espacios</h2>
              <p className="text-sm text-muted-foreground">
                {spaces.filter((space) => space.isActive).length} publicados / {spaces.length} totales
              </p>
            </div>

            <div className="space-y-4">
              {loadingData ? (
                <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
                  Cargando espacios...
                </div>
              ) : spaces.length === 0 ? (
                <div className="rounded-xl border border-border bg-card py-12 text-center">
                  <p className="mb-4 text-muted-foreground">Aún no has creado ningún espacio.</p>
                  <Button onClick={handleOpenAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crear primer espacio
                  </Button>
                </div>
              ) : (
                spaces.map((space) => (
                  <div key={space.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground">{space.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {space.canton}, {space.province}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <span className="text-foreground">
                              ₡{space.pricePerNight.toLocaleString()}/noche
                            </span>
                            <span className="text-foreground">
                              ₡{space.pricePerHour.toLocaleString()}/hora
                            </span>
                            <span className="text-foreground">Máx {space.maxPets} mascotas</span>
                            <span className={space.isActive ? "text-primary" : "text-muted-foreground"}>
                              {space.isActive ? "Publicado" : "Borrador"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => handleOpenEdit(space)} className="gap-2">
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant={space.isActive ? "outline" : "default"}
                            onClick={() => void handleToggleSpaceStatus(space, !space.isActive)}
                          >
                            {space.isActive ? "Desactivar" : "Publicar"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {expandedSpace === space.id && (
                      <div className="space-y-6 bg-background/50 p-6">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-foreground">Descripción</h4>
                          <p className="text-sm text-muted-foreground">{space.description}</p>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-foreground">Disponibilidad</h4>
                          <AvailabilityCalendar
                            blockedDates={blockedDates[space.id] || []}
                            onBlockDatesCreate={(dates, reason) =>
                              handleBlockDatesCreate(space.id, dates, reason)
                            }
                            onRemoveBlockedDate={(id) => handleRemoveBlockedDate(space.id, id)}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedSpace(expandedSpace === space.id ? null : space.id)}
                      className="w-full p-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary/50"
                    >
                      {expandedSpace === space.id ? "▲ Contraer" : "▼ Ver detalles"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-bold text-foreground">Reservas recibidas</h2>
            {loadingData ? (
              <div className="rounded-xl border border-border bg-card py-10 text-center text-muted-foreground">
                Cargando reservas...
              </div>
            ) : incomingBookings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-10 text-center text-muted-foreground">
                Aún no has recibido reservas.
              </div>
            ) : (
              <div className="space-y-4">
                {incomingBookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{booking.spaceName ?? "Espacio Donver"}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.ownerName ?? "Usuario Donver"} • {booking.petIds.length} mascota(s)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.startDate.toLocaleDateString("es-CR")} - {booking.endDate.toLocaleDateString("es-CR")}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {statusLabels[booking.status] ?? "Pendiente"} • ₡{booking.totalPrice.toLocaleString("es-CR")}
                      </div>
                    </div>
                    <Button
                      variant="link"
                      className="mt-3 h-auto px-0"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <SpaceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(spaceData) => void handleSaveSpace(spaceData)}
        space={selectedSpace}
        caregiverDefaults={
          user
            ? {
                province: user.province,
                canton: user.canton,
              }
            : undefined
        }
      />

      <Footer />
    </>
  );
}
