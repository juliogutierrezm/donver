export type UserRole = "owner" | "caregiver";
export type SignupIntent = "caregiver";
export type Province =
  | "San José"
  | "Alajuela"
  | "Cartago"
  | "Heredia"
  | "Guanacaste"
  | "Puntarenas"
  | "Limón";

export interface CaregiverStatus {
  profileComplete: boolean;
  operationalReady: boolean;
  missingProfileFields: string[];
  hasPublishableSpace: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  roles: UserRole[];
  activeRole?: UserRole;
  avatar?: string;
  createdAt: Date;
  province: Province;
  canton: string;
  signupIntent?: SignupIntent | null;
  caregiverStatus?: CaregiverStatus;
}

export type PetType = "dog" | "cat" | "bird" | "other";
export type PetSize = "small" | "medium" | "large";

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  type: PetType;
  breed?: string;
  age: number;
  size: PetSize;
  description?: string;
  photos: string[];
  specialNeeds?: string;
}

export interface Space {
  id: string;
  caregiverId: string;
  title: string;
  description: string;
  photos: string[];
  province: Province;
  canton: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  pricePerHour: number;
  minHours: number;
  acceptedPetTypes: PetType[];
  acceptedPetSizes: PetSize[];
  maxPets: number;
  amenities: string[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
}

export type BookingType = "hourly" | "overnight";
export type SpaceWithCoords = Space;
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface Booking {
  id: string;
  spaceId: string;
  ownerId: string;
  petIds: string[];
  bookingType: BookingType;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  hours?: number;
  subtotal: number;
  serviceFee: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  notes?: string;
}

export interface BlockedDate {
  id: string;
  spaceId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  spaceId: string;
  ownerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export const PROVINCES: Province[] = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
];

export const CANTONES: Record<Province, string[]> = {
  "San José": [
    "San José",
    "Escazú",
    "Desamparados",
    "Puriscal",
    "Tarrazú",
    "Aserrí",
    "Mora",
    "Goicoechea",
    "Santa Ana",
    "Alajuelita",
    "Coronado",
    "Curridabat",
    "Pérez Zeledón",
  ],
  Alajuela: [
    "Alajuela",
    "San Ramón",
    "Grecia",
    "San Mateo",
    "Atenas",
    "Naranjo",
    "Palmares",
    "San Carlos",
    "Zarcero",
    "Valverde Vega",
    "Upala",
    "Los Chiles",
    "Guatuso",
  ],
  Cartago: [
    "Cartago",
    "Paraíso",
    "La Unión",
    "Jiménez",
    "Turrialba",
    "Alvarado",
    "Oreamuno",
    "El Guarco",
  ],
  Heredia: [
    "Heredia",
    "Barba",
    "Santo Domingo",
    "Santa Bárbara",
    "San Isidro",
    "Belén",
    "Flores",
    "San Pablo",
    "San Rafael",
  ],
  Guanacaste: [
    "Liberia",
    "Nicoya",
    "Santa Cruz",
    "Bagaces",
    "Tiliarán",
    "Nandayure",
    "La Cruz",
    "Hojancha",
    "Cañas",
  ],
  Puntarenas: [
    "Puntarenas",
    "Esparza",
    "Buenos Aires",
    "Montes de Oro",
    "Osa",
    "Quepos",
    "Golfito",
    "Parrita",
    "Corredores",
    "Garabito",
  ],
  Limón: [
    "Limón",
    "Pocora",
    "Siquirres",
    "Guácimo",
    "Matina",
    "Batán",
    "Cariari",
    "Talamanca",
  ],
};

export const PET_TYPES: PetType[] = ["dog", "cat", "bird", "other"];

export const PET_SIZES: PetSize[] = ["small", "medium", "large"];

export const AMENITIES = [
  "Jardín cercado",
  "Aire acondicionado",
  "Cámaras de seguridad",
  "Piscina para mascotas",
  "Área de juegos",
  "Paseos diarios",
  "Alimentación premium",
  "Atención veterinaria",
  "Servicio 24/7",
  "Transporte incluido",
] as const;
