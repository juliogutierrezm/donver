import { addDays } from "date-fns";
import type { Space, BlockedDate } from "@/types";

// Mock caregiver profile
export const mockCaregiverProfile = {
  id: "caregiver-1",
  userId: "user-1",
  name: "Carlos Rodríguez",
  email: "carlos@example.com",
  phone: "+506 8765 4321",
  province: "San José",
  canton: "Escazú",
  bio: "Amante de los animales con 5+ años de experiencia cuidando mascotas. Mi casa es segura, espaciosa y perfecta para perros y gatos.",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
  rating: 4.8,
  reviewCount: 42,
  isVerified: true,
  responseTime: "< 1 hora",
};

// Mock spaces for caregiver
export const mockCaregiverSpaces: Space[] = [
  {
    id: "space-caregiver-1",
    caregiverId: "caregiver-1",
    title: "Casa con Jardín Amplio",
    description: "Hermosa casa en Escazú con gran jardín cerrado, ideal para perros de cualquier tamaño. Tiene piscina, aire acondicionado y vigilancia 24/7.",
    province: "San José",
    canton: "Escazú",
    address: "Calle Principal, Escazú",
    latitude: 9.92,
    longitude: -84.1,
    photos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
      "https://images.unsplash.com/photo-1576591335007-112f50fbf47d?w=800&q=80",
    ],
    pricePerNight: 45000,
    pricePerHour: 12000,
    minHours: 2,
    maxPets: 4,
    acceptedPetTypes: ["dog", "cat"],
    acceptedPetSizes: ["small", "medium", "large"],
    amenities: ["Jardín cercado", "Piscina para mascotas", "Aire acondicionado", "Cámaras de seguridad", "Área de juegos", "Paseos diarios", "Alimentación premium"],
    isActive: true,
    rating: 4.9,
    reviewCount: 28,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "space-caregiver-2",
    caregiverId: "caregiver-1",
    title: "Apartamento Pet-Friendly en Centro",
    description: "Acogedor apartamento en el centro con balcón y todo lo necesario para que tu mascota se sienta como en casa. Ubicación céntrica, fácil acceso.",
    province: "San José",
    canton: "San José",
    address: "Avenida Central, San José",
    latitude: 9.93,
    longitude: -84.08,
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    pricePerNight: 32000,
    pricePerHour: 9000,
    minHours: 2,
    maxPets: 3,
    acceptedPetTypes: ["cat", "bird"],
    acceptedPetSizes: ["small", "medium"],
    amenities: ["Aire acondicionado", "Cámaras de seguridad"],
    isActive: true,
    rating: 4.7,
    reviewCount: 15,
    createdAt: new Date("2024-02-20"),
  },
];

// Mock blocked dates for caregiver spaces
export const mockBlockedDates: Record<string, BlockedDate[]> = {
  "space-caregiver-1": [
    {
      id: "blocked-1",
      spaceId: "space-caregiver-1",
      startDate: addDays(new Date(), 5),
      endDate: addDays(new Date(), 8),
      reason: "Vacaciones",
    },
    {
      id: "blocked-2",
      spaceId: "space-caregiver-1",
      startDate: addDays(new Date(), 20),
      endDate: addDays(new Date(), 22),
      reason: "Mantenimiento",
    },
  ],
  "space-caregiver-2": [
    {
      id: "blocked-3",
      spaceId: "space-caregiver-2",
      startDate: addDays(new Date(), 10),
      endDate: addDays(new Date(), 12),
      reason: "Viaje de negocio",
    },
  ],
};

export function getBlockedDatesForSpace(spaceId: string): BlockedDate[] {
  return mockBlockedDates[spaceId] || [];
}
