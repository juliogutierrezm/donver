import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { BookingsTab } from "@/components/profile/BookingsTab";
import { PetsTab } from "@/components/profile/PetsTab";
import { FavoritesTab } from "@/components/profile/FavoritesTab";
import { CaregiverStatusBanner } from "@/components/profile/CaregiverStatusBanner";
import { useFavorites } from "@/hooks/useFavorites";
import { authApi, bookingsApi, getUserExperienceMode, petsApi, spacesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { APP_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Booking, Pet, Space, User } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [caregiverBookings, setCaregiverBookings] = useState<Booking[]>([]);
  const [caregiverSpaces, setCaregiverSpaces] = useState<Space[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const {
    favorites,
    isLoading: loadingFavorites,
    isError: favoritesError,
    error: favoritesErrorValue,
  } = useFavorites();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingData(true);
      try {
        const currentUser = await authApi.getCurrentUser();
        if (cancelled) return;

        const ownerRequests = currentUser.roles.includes("owner")
          ? Promise.all([petsApi.listMine(), bookingsApi.listMine()])
          : Promise.resolve([[], []] as [Pet[], Booking[]]);
        const caregiverRequests = currentUser.roles.includes("caregiver")
          ? Promise.all([spacesApi.getMine(), bookingsApi.listCaregiver()])
          : Promise.resolve([[], []] as [Space[], Booking[]]);

        const [[currentPets, currentBookings], [mySpaces, receivedBookings]] = await Promise.all([
          ownerRequests,
          caregiverRequests,
        ]);
        if (cancelled) return;

        setUser(currentUser);
        setPets(currentPets);
        setBookings(currentBookings);
        setCaregiverSpaces(mySpaces);
        setCaregiverBookings(receivedBookings);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message.includes("sesion")) {
          navigate(`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.profile)}`);
          return;
        }
        toast({
          title: "No se pudo cargar el perfil",
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

  const handlePetAdded = async (pet: Pet) => {
    const { id: _id, ...petInput } = pet;
    const createdPet = await petsApi.create(petInput);
    setPets((currentPets) => [...currentPets, createdPet]);
  };

  const handlePetUpdated = async (updatedPet: Pet) => {
    const savedPet = await petsApi.update(updatedPet.id, updatedPet);
    setPets((currentPets) => currentPets.map((pet) => (pet.id === savedPet.id ? savedPet : pet)));
  };

  const handlePetDeleted = async (petId: string) => {
    await petsApi.remove(petId);
    setPets((currentPets) => currentPets.filter((pet) => pet.id !== petId));
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate(APP_ROUTES.login);
  };

  const handleSetActiveRole = async (role: User["activeRole"]) => {
    if (!user || !role) return;
    const canSwitchView = user.roles.includes("owner") && user.roles.includes("caregiver");
    if (!canSwitchView || !user.roles.includes(role)) {
      return;
    }
    const updated = await authApi.updateProfile({
      activeRole: role,
    });
    setUser(updated);
  };

  const activeView = useMemo<"owner" | "caregiver" | "pending">(() => {
    if (!user) return "owner";
    const experienceMode = getUserExperienceMode(user);
    if (experienceMode === "caregiver_pending") return "pending";
    if (experienceMode === "both") {
      return user.activeRole === "caregiver" ? "caregiver" : "owner";
    }
    if (user.roles.includes("caregiver") && !user.roles.includes("owner")) {
      return "caregiver";
    }
    return "owner";
  }, [user]);

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </main>
        <Footer />
      </>
    );
  }

  const experienceMode = getUserExperienceMode(user);
  const showRoleSelector = user.roles.includes("caregiver") && user.roles.includes("owner");
  const isCaregiverOnly = user.roles.includes("caregiver") && !user.roles.includes("owner");
  const showFavoritesTab = user.roles.includes("owner");
  const showCaregiverExperience = activeView === "caregiver" || activeView === "pending";

  const caregiverContent = (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-medium sm:p-6">
        <h2 className="text-xl font-bold text-foreground">Como cuidador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {experienceMode === "caregiver_pending"
            ? "Completa tu onboarding para activar estas herramientas."
            : "Gestiona tus espacios y revisa tus reservas recibidas."}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-medium sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Espacios publicados o en borrador</h3>
        {loadingData ? (
          <p className="text-sm text-muted-foreground">Cargando espacios...</p>
        ) : caregiverSpaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has creado espacios.</p>
        ) : (
          <div className="space-y-3">
            {caregiverSpaces.map((space) => (
              <div key={space.id} className="rounded-xl border border-border/70 bg-background/70 p-4 transition-colors duration-200 hover:bg-muted/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{space.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {space.canton}, {space.province}
                    </p>
                  </div>
                  <span className={space.isActive ? "text-primary" : "text-muted-foreground"}>
                    {space.isActive ? "Publicado" : "Borrador"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-medium sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Reservas recibidas</h3>
        {loadingData ? (
          <p className="text-sm text-muted-foreground">Cargando reservas...</p>
        ) : caregiverBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has recibido reservas.</p>
        ) : (
          <div className="space-y-3">
            {caregiverBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-border/70 bg-background/70 p-4 transition-colors duration-200 hover:bg-muted/30">
                <p className="font-semibold text-foreground">{booking.spaceName ?? "Espacio Donver"}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.ownerName ?? "Usuario Donver"} • {booking.petIds.length} mascota(s)
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.startDate.toLocaleDateString("es-CR")} - {booking.endDate.toLocaleDateString("es-CR")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusLabels[booking.status] ?? "Pendiente"} • ₡{booking.totalPrice.toLocaleString("es-CR")}
                </p>
                <Button
                  variant="link"
                  className="mt-2 h-auto px-0"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  Ver detalles
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCaregiverOnly && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-medium sm:p-6">
          <h3 className="text-lg font-semibold text-foreground">Quiero reservar como dueño</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Activa tu perfil de dueño para registrar mascotas y reservar espacios para tus mascotas.
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => navigate(APP_ROUTES.becomeOwner)}>
            Activar perfil de dueño
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-heading font-bold text-foreground">Mi Perfil</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona tu cuenta, tus mascotas y tu experiencia dentro de Donver.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
            <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
              <UserInfoCard
                user={user}
                onLogout={() => void handleLogout()}
                onSetActiveRole={showRoleSelector ? (role) => void handleSetActiveRole(role) : undefined}
              />
            </div>

            <div className="space-y-6 lg:col-span-3">
              {showCaregiverExperience && <CaregiverStatusBanner user={user} />}

              {showCaregiverExperience ? (
                <div className="space-y-6">{caregiverContent}</div>
              ) : (
                <Tabs defaultValue="bookings" className="w-full">
                  <TabsList
                    className={cn(
                      "grid h-auto w-full gap-2 rounded-2xl bg-muted/60 p-1.5",
                      showFavoritesTab ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                    )}
                  >
                    <TabsTrigger
                      value="bookings"
                      className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-background/80 hover:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-soft"
                    >
                      Reservaciones
                    </TabsTrigger>
                    <TabsTrigger
                      value="pets"
                      className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-background/80 hover:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-soft"
                    >
                      Mascotas
                    </TabsTrigger>
                    {showFavoritesTab && (
                      <TabsTrigger
                        value="favorites"
                        className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-background/80 hover:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-soft"
                      >
                        Favoritos
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="bookings" className="mt-5 space-y-6">
                    <BookingsTab bookings={bookings} />
                  </TabsContent>

                  <TabsContent value="pets" className="mt-5 space-y-6">
                    <PetsTab
                      pets={pets}
                      onPetAdded={(pet) => void handlePetAdded(pet)}
                      onPetUpdated={(pet) => void handlePetUpdated(pet)}
                      onPetDeleted={(petId) => void handlePetDeleted(petId)}
                    />
                  </TabsContent>

                  {showFavoritesTab && (
                    <TabsContent value="favorites" className="mt-5 space-y-6">
                      {loadingFavorites ? (
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                          <p className="text-sm text-muted-foreground">Cargando favoritos...</p>
                        </div>
                      ) : favoritesError ? (
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                          <h3 className="text-lg font-semibold text-foreground">Favoritos</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {favoritesErrorValue instanceof Error
                              ? favoritesErrorValue.message
                              : "No se pudieron cargar tus favoritos."}
                          </p>
                        </div>
                      ) : (
                        <FavoritesTab favorites={favorites} />
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
