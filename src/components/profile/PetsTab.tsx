import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetFormDialog } from "./PetFormDialog";
import type { Pet } from "@/types";

interface PetsTabProps {
  pets: Pet[];
  onPetAdded: (pet: Pet) => void | Promise<void>;
  onPetUpdated: (pet: Pet) => void | Promise<void>;
  onPetDeleted: (petId: string) => void | Promise<void>;
}

export function PetsTab({
  pets,
  onPetAdded,
  onPetUpdated,
  onPetDeleted,
}: PetsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | undefined>();

  const handleOpenAdd = () => {
    setSelectedPet(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    setSelectedPet(pet);
    setFormOpen(true);
  };

  const handleSave = async (petData: Partial<Pet>) => {
    if (selectedPet) {
      await onPetUpdated({ ...selectedPet, ...petData } as Pet);
    } else {
      const newPet: Pet = {
        id: `pet-${Date.now()}`,
        ownerId: "user-1",
        ...petData,
      } as Pet;
      await onPetAdded(newPet);
    }
    setFormOpen(false);
  };

  if (pets.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-muted-foreground mb-6">Aún no has registrado mascotas.</p>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar mascota
          </Button>
        </div>

        <PetFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSave={handleSave}
          pet={selectedPet}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-6">
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar mascota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            {/* Photo */}
            {pet.photos.length > 0 && (
              <div className="mb-3 rounded-lg overflow-hidden h-40 bg-muted">
                <img
                  src={pet.photos[0]}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Info */}
            <h3 className="font-semibold text-foreground text-lg mb-1">
              {pet.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {pet.type === "dog"
                ? "🐕"
                : pet.type === "cat"
                  ? "🐱"
                  : pet.type === "bird"
                    ? "🦜"
                    : "🐾"}{" "}
              {pet.breed || "Sin raza especificada"}
            </p>

            {/* Details */}
            <div className="space-y-1 text-xs text-muted-foreground mb-4">
              <p>
                <span className="text-foreground font-semibold">{pet.age}</span> años
              </p>
              <p>
                Tamaño:{" "}
                <span className="text-foreground font-semibold">
                  {pet.size === "small"
                    ? "Pequeño"
                    : pet.size === "medium"
                      ? "Mediano"
                      : "Grande"}
                </span>
              </p>
              {pet.specialNeeds && (
                <p>
                  ⚠️ <span className="text-foreground">{pet.specialNeeds}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenEdit(pet)}
                className="flex-1 text-sm font-semibold text-primary hover:underline py-2"
              >
                Editar
              </button>
              <button
                onClick={() => onPetDeleted(pet.id)}
                className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <PetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        pet={selectedPet}
      />
    </div>
  );
}
