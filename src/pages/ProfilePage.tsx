import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { BookingsTab } from "@/components/profile/BookingsTab";
import { PetsTab } from "@/components/profile/PetsTab";
import { FavoritesTab } from "@/components/profile/FavoritesTab";
import { getMockFavoriteSpaces } from "@/data/mockProfileData";
import { authApi, bookingsApi, petsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Pet, Booking, User } from "@/types";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const favoriteSpaces = getMockFavoriteSpaces();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [currentUser, currentPets, currentBookings] = await Promise.all([
          authApi.getCurrentUser(),
          petsApi.listMine(),
          bookingsApi.listMine(),
        ]);
        if (cancelled) return;
        setUser(currentUser);
        setPets(currentPets);
        setBookings(currentBookings);
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "No se pudo cargar el perfil",
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
    navigate("/login");
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-heading font-bold text-foreground">
              Mi Perfil
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu información, mascotas y reservaciones
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <UserInfoCard user={user} onLogout={() => void handleLogout()} />
            </div>

            <div className="lg:col-span-3">
              <Tabs defaultValue="bookings" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bookings">Reservaciones</TabsTrigger>
                  <TabsTrigger value="pets">Mascotas</TabsTrigger>
                  <TabsTrigger value="favorites">Favoritos</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="space-y-6 mt-6">
                  <BookingsTab bookings={bookings} />
                </TabsContent>

                <TabsContent value="pets" className="space-y-6 mt-6">
                  <PetsTab
                    pets={pets}
                    onPetAdded={(pet) => void handlePetAdded(pet)}
                    onPetUpdated={(pet) => void handlePetUpdated(pet)}
                    onPetDeleted={(petId) => void handlePetDeleted(petId)}
                  />
                </TabsContent>

                <TabsContent value="favorites" className="space-y-6 mt-6">
                  <FavoritesTab favorites={favoriteSpaces} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
