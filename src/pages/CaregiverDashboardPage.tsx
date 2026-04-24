import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SpaceFormDialog } from "@/components/caregiver/SpaceFormDialog";
import { AvailabilityCalendar } from "@/components/caregiver/AvailabilityCalendar";
import { authApi, availabilityApi, spacesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { BlockedDate, Space, User } from "@/types";

export default function CaregiverDashboardPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [blockedDates, setBlockedDates] = useState<Record<string, BlockedDate[]>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>();
  const [expandedSpace, setExpandedSpace] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [currentUser, currentSpaces] = await Promise.all([
          authApi.getCurrentUser(),
          spacesApi.getMine(),
        ]);
        if (cancelled) return;

        setUser(currentUser);
        setSpaces(currentSpaces);

        const blockedEntries = await Promise.all(
          currentSpaces.map(async (space) => [space.id, await availabilityApi.list(space.id)] as const)
        );
        if (cancelled) return;
        setBlockedDates(Object.fromEntries(blockedEntries));
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "No se pudo cargar el dashboard",
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
  }, [toast]);

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
        const created = await spacesApi.create({
          caregiverId: user?.id ?? "",
          title: spaceData.title ?? "",
          description: spaceData.description ?? "",
          photos: spaceData.photos ?? [],
          province: spaceData.province ?? "San José",
          canton: spaceData.canton ?? "San José",
          address: spaceData.address ?? "",
          latitude: spaceData.latitude ?? 9.93,
          longitude: spaceData.longitude ?? -84.08,
          pricePerNight: spaceData.pricePerNight ?? 0,
          pricePerHour: spaceData.pricePerHour ?? 0,
          minHours: spaceData.minHours ?? 1,
          acceptedPetTypes: spaceData.acceptedPetTypes ?? [],
          acceptedPetSizes: spaceData.acceptedPetSizes ?? [],
          maxPets: spaceData.maxPets ?? 1,
          amenities: spaceData.amenities ?? [],
          isActive: spaceData.isActive ?? true,
        });
        setSpaces((currentSpaces) => [created, ...currentSpaces]);
        setBlockedDates((currentBlocked) => ({ ...currentBlocked, [created.id]: [] }));
      }

      setFormOpen(false);
      toast({
        title: selectedSpace ? "Espacio actualizado" : "Espacio creado",
        description: "Los cambios se guardaron correctamente.",
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

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      const updated = await spacesApi.update(spaceId, { isActive: false });
      setSpaces((currentSpaces) =>
        currentSpaces.map((space) => (space.id === updated.id ? updated : space))
      );
      toast({
        title: "Espacio desactivado",
        description: "El espacio ya no aparecerá como disponible.",
      });
    } catch (error) {
      toast({
        title: "No se pudo desactivar el espacio",
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground">
                  Dashboard de Cuidador
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gestiona tus espacios y disponibilidad
                </p>
              </div>
              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Espacio
              </Button>
            </div>
          </div>

          {user && (
            <div className="bg-card border border-border rounded-xl p-6 mb-12">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-primary text-primary" />
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
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                  <span className="text-sm font-semibold text-primary">✓ Cuenta activa</span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Mis Espacios</h2>
            <div className="space-y-4">
              {spaces.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground mb-4">Aún no has creado ningún espacio</p>
                  <Button onClick={handleOpenAdd} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Crear primer espacio
                  </Button>
                </div>
              ) : (
                spaces.map((space) => (
                  <div key={space.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground">{space.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {space.canton}, {space.province}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-foreground">
                              💰 ₡{space.pricePerNight.toLocaleString()}/noche
                            </span>
                            <span className="text-foreground">
                              ⏱️ ₡{space.pricePerHour.toLocaleString()}/hora
                            </span>
                            <span className="text-foreground">🐾 Máx {space.maxPets} mascotas</span>
                            <span className={space.isActive ? "text-primary" : "text-muted-foreground"}>
                              {space.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(space)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDeleteSpace(space.id)}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedSpace === space.id && (
                      <div className="p-6 space-y-6 bg-background/50">
                        <div>
                          <h4 className="font-semibold text-foreground text-sm mb-2">Descripción</h4>
                          <p className="text-sm text-muted-foreground">{space.description}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground text-sm mb-2">
                            Tipos de mascotas aceptadas
                          </h4>
                          <div className="flex gap-2">
                            {space.acceptedPetTypes.map((type) => (
                              <span key={type} className="text-xs bg-secondary px-2 py-1 rounded text-foreground">
                                {type === "dog"
                                  ? "🐕 Perros"
                                  : type === "cat"
                                    ? "🐱 Gatos"
                                    : type === "bird"
                                      ? "🦜 Aves"
                                      : "🐾 Otros"}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground text-sm mb-4">Disponibilidad</h4>
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
                      className="w-full p-3 text-sm font-semibold text-primary hover:bg-secondary/50 transition-colors"
                    >
                      {expandedSpace === space.id ? "▲ Contraer" : "▼ Expandir"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <SpaceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(spaceData) => void handleSaveSpace(spaceData)}
        space={selectedSpace}
      />

      <Footer />
    </>
  );
}
