import type { Pet, Booking, SpaceWithCoords } from "@/types/index";
import { mockSpaces } from "./mockData";

export const mockPets: Pet[] = [
  {
    id: "pet-1",
    ownerId: "user-1",
    name: "Luna",
    type: "dog",
    breed: "Golden Retriever",
    age: 3,
    size: "large",
    description: "Perro amigable y energético, le encanta jugar.",
    photos: [
      "https://images.unsplash.com/photo-1633722715463-d30628ceb4a3?w=500&h=400",
    ],
    specialNeeds: "Necesita paseos diarios largos",
  },
  {
    id: "pet-2",
    ownerId: "user-1",
    name: "Miso",
    type: "cat",
    breed: "Gato Persa",
    age: 5,
    size: "small",
    description: "Gata tranquila y cariñosa.",
    photos: [
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400",
    ],
  },
  {
    id: "pet-3",
    ownerId: "user-1",
    name: "Rocky",
    type: "dog",
    breed: "Bulldog Francés",
    age: 2,
    size: "small",
    description: "Perrito juguetón y cariñoso.",
    photos: [
      "https://images.unsplash.com/photo-1583511655857-d19db992cb74?w=500&h=400",
    ],
    specialNeeds: "Sensible al calor, necesita aire acondicionado",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "booking-1",
    spaceId: "space-1",
    ownerId: "user-1",
    petIds: ["pet-1"],
    bookingType: "overnight",
    startDate: new Date("2024-04-25"),
    endDate: new Date("2024-04-27"),
    subtotal: 90000,
    serviceFee: 9000,
    totalPrice: 99000,
    status: "confirmed",
    paymentStatus: "paid",
    createdAt: new Date("2024-04-20"),
  },
  {
    id: "booking-2",
    spaceId: "space-3",
    ownerId: "user-1",
    petIds: ["pet-2", "pet-3"],
    bookingType: "hourly",
    startDate: new Date("2024-05-01"),
    endDate: new Date("2024-05-01"),
    startTime: "10:00",
    endTime: "16:00",
    hours: 6,
    subtotal: 57000,
    serviceFee: 5700,
    totalPrice: 62700,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date("2024-04-22"),
  },
  {
    id: "booking-3",
    spaceId: "space-2",
    ownerId: "user-1",
    petIds: ["pet-1"],
    bookingType: "overnight",
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-03-18"),
    subtotal: 105000,
    serviceFee: 10500,
    totalPrice: 115500,
    status: "completed",
    paymentStatus: "paid",
    createdAt: new Date("2024-03-10"),
    notes: "Luna se comportó muy bien, muchas gracias!",
  },
];

export const mockFavoriteSpaceIds: string[] = [
  "space-1",
  "space-3",
  "space-5",
  "space-6",
];

export function getMockFavoriteSpaces(): SpaceWithCoords[] {
  return mockSpaces.filter((space) => mockFavoriteSpaceIds.includes(space.id));
}

export function getSpaceById(id: string): SpaceWithCoords | undefined {
  return mockSpaces.find((space) => space.id === id);
}
