import type { PetSize, PetType } from "@/types";

const PET_TYPE_LABELS: Record<PetType, string> = {
  dog: "Perros",
  cat: "Gatos",
  bird: "Aves",
  rabbit: "Conejos",
  hamster: "Hámsteres",
  snake: "Serpientes",
  reptile: "Reptiles",
  fish: "Peces",
  other: "Otro",
};

const PET_TYPE_SINGULAR_LABELS: Record<PetType, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  hamster: "Hámster",
  snake: "Serpiente",
  reptile: "Reptil",
  fish: "Pez",
  other: "Otro",
};

const PET_TYPE_ICONS: Record<PetType, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🦜",
  rabbit: "🐇",
  hamster: "🐹",
  snake: "🐍",
  reptile: "🦎",
  fish: "🐠",
  other: "🐾",
};

const PET_SIZE_LABELS: Record<PetSize, string> = {
  small: "Pequeño",
  medium: "Mediano",
  large: "Grande",
};

const PET_SIZE_HELP: Record<PetSize, string> = {
  small: "Hasta 10 kg. Ejemplos: Chihuahua, Pomerania, Yorkshire Terrier, Shih Tzu pequeño.",
  medium: "De 10 a 25 kg. Ejemplos: Beagle, Cocker Spaniel, Border Collie pequeño, Bulldog francés grande.",
  large: "Más de 25 kg. Ejemplos: Labrador, Golden Retriever, Pastor Alemán, Rottweiler.",
};

export function getPetTypeLabel(type: PetType) {
  return PET_TYPE_LABELS[type];
}

export function getPetTypeSingularLabel(type: PetType) {
  return PET_TYPE_SINGULAR_LABELS[type];
}

export function getPetTypeIcon(type: PetType) {
  return PET_TYPE_ICONS[type];
}

export function getPetSizeLabel(size: PetSize) {
  return PET_SIZE_LABELS[size];
}

export function getPetSizeHelp(size: PetSize) {
  return PET_SIZE_HELP[size];
}

export function formatPetTypeAndSize(type: PetType, size?: PetSize) {
  const parts = [getPetTypeSingularLabel(type)];
  if (size) {
    parts.push(getPetSizeLabel(size));
  }
  return parts.join(" • ");
}
