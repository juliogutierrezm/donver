import type {
  BlockedDate,
  Booking,
  BookingStatus,
  PaymentStatus,
  Pet,
  PetSize,
  PetType,
  Province,
  Review,
  Space,
  User,
  UserRole,
} from "@/types";
import type {
  Conversation,
  ConversationParticipant,
  ConversationWithDetails,
  Message,
} from "@/types/messaging";
import { mockUser, mockSpaces } from "@/data/mockData";
import { mockPets, mockBookings } from "@/data/mockProfileData";
import {
  mockCaregiverSpaces,
  mockBlockedDates,
  mockCaregiverProfile,
} from "@/data/mockCaregiverData";
import {
  getUserById,
  mockConversations,
  mockMessages,
  mockParticipants,
} from "@/data/mockMessagingData";

const API_PLACEHOLDER_BASE_URL = "aws-placeholder://donver-phase-12";
const AUTH_SESSION_STORAGE_KEY = "donver.auth.session";
const AUTH_SESSION_EVENT = "donver:auth-session-changed";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  API_PLACEHOLDER_BASE_URL;
export const IS_API_CONFIGURED = API_BASE_URL !== API_PLACEHOLDER_BASE_URL;

const AWS_REGION = (import.meta.env.VITE_AWS_REGION as string | undefined)?.trim() || "us-east-1";
const COGNITO_USER_POOL_ID =
  (import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined)?.trim() || "";
const COGNITO_CLIENT_ID =
  (import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined)?.trim() || "";
const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined)?.trim() || "";

const PLACEHOLDER_DELAY_MS = 120;

const provinceToBackend: Record<Province, string> = {
  "San José": "San Jose",
  Alajuela: "Alajuela",
  Cartago: "Cartago",
  Heredia: "Heredia",
  Guanacaste: "Guanacaste",
  Puntarenas: "Puntarenas",
  Limón: "Limon",
};

const provinceFromBackend: Record<string, Province> = {
  "San Jose": "San José",
  "San José": "San José",
  Alajuela: "Alajuela",
  Cartago: "Cartago",
  Heredia: "Heredia",
  Guanacaste: "Guanacaste",
  Puntarenas: "Puntarenas",
  Limon: "Limón",
  Limón: "Limón",
};

const defaultProvince: Province = "San José";
const defaultPetSize: PetSize = "medium";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthCredentials {
  name: string;
  phone?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt?: string;
}

export interface SpaceFilters {
  province?: Space["province"];
  canton?: string;
  petType?: Space["acceptedPetTypes"][number];
  maxNightPrice?: number;
  caregiverId?: string;
  onlyActive?: boolean;
}

export interface CreateBookingInput {
  spaceId: string;
  ownerId: string;
  petIds: string[];
  bookingType: Booking["bookingType"];
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  hours?: number;
  subtotal: number;
  serviceFee: number;
  totalPrice: number;
  notes?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  uploadUrl?: string;
}

export interface PaymentIntent {
  bookingId: string;
  amount: number;
  currency: "CRC";
  status: PaymentStatus;
  checkoutUrl: string;
}

function delay(ms = PLACEHOLDER_DELAY_MS) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneDate(value: Date) {
  return new Date(value);
}

function cloneUser(user: User): User {
  return { ...user, createdAt: cloneDate(user.createdAt) };
}

function clonePet(pet: Pet): Pet {
  return { ...pet, photos: [...pet.photos] };
}

function cloneSpace(space: Space): Space {
  return {
    ...space,
    photos: [...space.photos],
    acceptedPetTypes: [...space.acceptedPetTypes],
    acceptedPetSizes: [...space.acceptedPetSizes],
    amenities: [...space.amenities],
    createdAt: cloneDate(space.createdAt),
  };
}

function cloneBooking(booking: Booking): Booking {
  return {
    ...booking,
    petIds: [...booking.petIds],
    startDate: cloneDate(booking.startDate),
    endDate: cloneDate(booking.endDate),
    createdAt: cloneDate(booking.createdAt),
  };
}

function cloneBlockedDate(blockedDate: BlockedDate): BlockedDate {
  return {
    ...blockedDate,
    startDate: cloneDate(blockedDate.startDate),
    endDate: cloneDate(blockedDate.endDate),
  };
}

function cloneReview(review: Review): Review {
  return { ...review, createdAt: cloneDate(review.createdAt) };
}

function cloneConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    createdAt: cloneDate(conversation.createdAt),
    updatedAt: cloneDate(conversation.updatedAt),
  };
}

function cloneParticipant(participant: ConversationParticipant): ConversationParticipant {
  return { ...participant, createdAt: cloneDate(participant.createdAt) };
}

function cloneMessage(message: Message): Message {
  return {
    ...message,
    createdAt: cloneDate(message.createdAt),
    readAt: message.readAt ? cloneDate(message.readAt) : undefined,
  };
}

function cloneSession(session: AuthSession): AuthSession {
  return { ...session, user: cloneUser(session.user) };
}

function requireEntity<T>(entity: T | undefined, message: string): T {
  if (!entity) {
    throw new Error(message);
  }
  return entity;
}

function normalizeProvince(value?: string): Province {
  return provinceFromBackend[value ?? ""] ?? defaultProvince;
}

function toBackendProvince(value?: string): string {
  if (!value) return provinceToBackend[defaultProvince];
  return provinceToBackend[value as Province] ?? value;
}

function normalizePetType(value?: string): PetType {
  if (value === "dog" || value === "cat" || value === "bird" || value === "other") {
    return value;
  }
  return "other";
}

function normalizePetSize(value?: string): PetSize {
  if (value === "small" || value === "medium" || value === "large") {
    return value;
  }
  return defaultPetSize;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toDate(value?: string | number | Date | null): Date {
  if (value instanceof Date) return cloneDate(value);
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string" && value.trim()) return new Date(value);
  return new Date();
}

function toDateOnly(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function isBrowserEnvironment() {
  return typeof window !== "undefined";
}

function notifyAuthSessionChanged() {
  if (!isBrowserEnvironment()) return;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function readSessionFromStorage(): AuthSession | null {
  if (!isBrowserEnvironment()) return null;
  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  const parsed = safeJsonParse<AuthSession>(raw);
  if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user) return null;
  return cloneSession(parsed);
}

let authSessionStore = readSessionFromStorage();

function persistAuthSession(session: AuthSession | null) {
  authSessionStore = session ? cloneSession(session) : null;
  if (!isBrowserEnvironment()) return;

  if (authSessionStore) {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authSessionStore));
  } else {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  notifyAuthSessionChanged();
}

export function getAuthSession() {
  return authSessionStore ? cloneSession(authSessionStore) : null;
}

export function getCurrentUserId() {
  return authSessionStore?.user.id ?? currentUserStore.id;
}

export function isAuthenticated() {
  return Boolean(authSessionStore?.accessToken);
}

export function subscribeAuthSession(listener: () => void) {
  if (!isBrowserEnvironment()) return () => undefined;

  const handler = () => listener();
  window.addEventListener(AUTH_SESSION_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

let currentUserStore = cloneUser(mockUser);
let spacesStore = [...mockSpaces, ...mockCaregiverSpaces].map(cloneSpace);
let petsStore = mockPets.map(clonePet);
let bookingsStore = mockBookings.map(cloneBooking);
let blockedDatesStore = Object.values(mockBlockedDates).flat().map(cloneBlockedDate);
let conversationsStore = mockConversations.map(cloneConversation);
let participantsStore = mockParticipants.map(cloneParticipant);
let messagesStore = mockMessages.map(cloneMessage);
let reviewsStore: Review[] = [
  {
    id: "review-1",
    bookingId: "booking-1",
    spaceId: "space-1",
    ownerId: "user-2",
    rating: 5,
    comment: "Excelente espacio, mi perro lo paso increible. Muy atento el cuidador.",
    createdAt: new Date("2024-04-08"),
  },
  {
    id: "review-2",
    bookingId: "booking-2",
    spaceId: "space-1",
    ownerId: "user-3",
    rating: 4,
    comment: "Muy buen lugar, limpio y con comunicacion rapida.",
    createdAt: new Date("2024-04-14"),
  },
  {
    id: "review-3",
    bookingId: "booking-3",
    spaceId: "space-3",
    ownerId: currentUserStore.id,
    rating: 5,
    comment: "La experiencia fue excelente y mis mascotas estuvieron felices.",
    createdAt: new Date("2024-04-18"),
  },
].map(cloneReview);

function currentUserProfile() {
  return {
    id: currentUserStore.id,
    name: currentUserStore.name,
    avatar: currentUserStore.avatar ?? "",
  };
}

function getConversationDetails(conversation: Conversation): ConversationWithDetails {
  const participants = participantsStore
    .filter((participant) => participant.conversationId === conversation.id)
    .map(cloneParticipant);
  const messages = messagesStore
    .filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const lastMessage = messages[0] ? cloneMessage(messages[0]) : undefined;
  const unreadCount = messages.filter(
    (message) => message.senderId !== currentUserStore.id && !message.readAt
  ).length;
  const otherParticipantId = participants.find(
    (participant) => participant.userId !== currentUserStore.id
  )?.userId;
  const otherParticipant =
    otherParticipantId === currentUserStore.id
      ? currentUserProfile()
      : otherParticipantId
        ? getUserById(otherParticipantId)
        : undefined;
  const spaceTitle = spacesStore.find((space) => space.id === conversation.spaceId)?.title;

  return {
    ...cloneConversation(conversation),
    participants,
    lastMessage,
    unreadCount,
    otherParticipant,
    spaceTitle,
  };
}

function ensureConfigured() {
  if (!IS_API_CONFIGURED) {
    throw new Error("La API de AWS no esta configurada.");
  }
}

function ensureSession() {
  const session = getAuthSession();
  if (!session) {
    throw new Error("Debes iniciar sesion para continuar.");
  }
  return session;
}

async function parseResponse(res: Response) {
  const text = await res.text();
  const json = text ? safeJsonParse<unknown>(text) : null;

  if (!res.ok) {
    const message =
      typeof json === "object" && json && "error" in json && typeof json.error === "string"
        ? json.error
        : text || `Error ${res.status}`;
    throw new Error(message);
  }

  return json;
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { auth?: boolean }
): Promise<T> {
  ensureConfigured();
  const auth = options?.auth ?? true;
  const headers = new Headers(init?.headers ?? {});

  if (auth) {
    const session = ensureSession();
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const isJsonBody =
    init?.body !== undefined &&
    init.body !== null &&
    typeof init.body === "string" &&
    !headers.has("Content-Type");

  if (isJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
  });

  return (await parseResponse(res)) as T;
}

type CognitoTarget =
  | "AWSCognitoIdentityProviderService.SignUp"
  | "AWSCognitoIdentityProviderService.InitiateAuth"
  | "AWSCognitoIdentityProviderService.ForgotPassword"
  | "AWSCognitoIdentityProviderService.ConfirmSignUp"
  | "AWSCognitoIdentityProviderService.ResendConfirmationCode";

class CognitoError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "CognitoError";
    this.code = code;
  }
}

function getCognitoErrorCode(payload: Record<string, unknown> | null) {
  const rawCode =
    (typeof payload?.__type === "string" && payload.__type) ||
    (typeof payload?.code === "string" && payload.code) ||
    (typeof payload?.Code === "string" && payload.Code) ||
    "";

  return rawCode.includes("#") ? rawCode.split("#").pop() : rawCode;
}

function translateCognitoErrorMessage(code?: string, fallback?: string) {
  switch (code) {
    case "UserNotConfirmedException":
      return "Tu correo aun no ha sido verificado. Ingresa el codigo que Cognito envio a tu email.";
    case "CodeMismatchException":
      return "El codigo de verificacion no es valido.";
    case "ExpiredCodeException":
      return "El codigo de verificacion expiro. Solicita uno nuevo.";
    case "TooManyFailedAttemptsException":
    case "TooManyRequestsException":
      return "Demasiados intentos. Espera un momento antes de intentarlo otra vez.";
    case "UsernameExistsException":
      return "Ya existe una cuenta con ese correo.";
    case "NotAuthorizedException":
      return "Las credenciales no son validas.";
    default:
      return fallback || "No se pudo completar la operacion con Cognito.";
  }
}

async function cognitoRequest<T>(target: CognitoTarget, body: Record<string, unknown>) {
  const res = await fetch(`https://cognito-idp.${AWS_REGION}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": target,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const json = text ? safeJsonParse<Record<string, unknown>>(text) : null;

  if (!res.ok) {
    const code = getCognitoErrorCode(json);
    const fallback =
      typeof json?.message === "string"
        ? json.message
        : typeof json?.Message === "string"
          ? json.Message
          : `Error Cognito ${res.status}`;
    throw new CognitoError(translateCognitoErrorMessage(code, fallback), code);
  }

  return (json ?? {}) as T;
}

function mapBackendUser(profile: Record<string, unknown>): User {
  return {
    id: String(profile.sub ?? profile.id ?? ""),
    email: String(profile.email ?? ""),
    name: String(profile.name ?? profile.email ?? "Usuario Donver"),
    phone: typeof profile.phone === "string" ? profile.phone : undefined,
    role: (profile.role as UserRole) ?? "owner",
    avatar: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
    createdAt: toDate((profile.created_at as string | undefined) ?? new Date()),
    province: normalizeProvince(profile.province as string | undefined),
    canton: typeof profile.canton === "string" && profile.canton ? profile.canton : "San Jose",
  };
}

function mapBackendSpace(space: Record<string, unknown>): Space {
  const photos = Array.isArray(space.photos) ? space.photos.map(String) : [];
  return {
    id: String(space.id ?? ""),
    caregiverId: String(space.caregiver_id ?? ""),
    title: String(space.name ?? space.title ?? "Espacio"),
    description: String(space.description ?? ""),
    photos,
    province: normalizeProvince(space.province as string | undefined),
    canton: String(space.canton ?? "San Jose"),
    address: String(space.address ?? ""),
    latitude: Number(space.latitude ?? 9.935),
    longitude: Number(space.longitude ?? -84.09),
    pricePerNight: Number(space.price_per_night ?? 0),
    pricePerHour: Number(space.price_per_hour ?? 0),
    minHours: Number(space.min_hours ?? 1),
    acceptedPetTypes: Array.isArray(space.accepted_pet_types)
      ? space.accepted_pet_types.map((value) => normalizePetType(String(value)))
      : [],
    acceptedPetSizes: Array.isArray(space.accepted_pet_sizes)
      ? space.accepted_pet_sizes.map((value) => normalizePetSize(String(value)))
      : [],
    maxPets: Number(space.max_pets ?? 1),
    amenities: Array.isArray(space.amenities) ? space.amenities.map(String) : [],
    isActive: Boolean(space.is_active ?? true),
    rating: Number(space.rating ?? 0),
    reviewCount: Number(space.review_count ?? 0),
    createdAt: toDate(space.created_at as string | undefined),
  };
}

function mapBackendPet(pet: Record<string, unknown>): Pet {
  return {
    id: String(pet.id ?? ""),
    ownerId: String(pet.owner_id ?? ""),
    name: String(pet.name ?? ""),
    type: normalizePetType(String(pet.species ?? pet.type ?? "other")),
    breed: typeof pet.breed === "string" ? pet.breed : undefined,
    age: Number(pet.age ?? 0),
    size: normalizePetSize(pet.size as string | undefined),
    description: typeof pet.description === "string" ? pet.description : undefined,
    photos: Array.isArray(pet.photos) ? pet.photos.map(String) : [],
    specialNeeds: typeof pet.medical_notes === "string" ? pet.medical_notes : undefined,
  };
}

function mapBackendBooking(booking: Record<string, unknown>): Booking {
  const status = (booking.status as BookingStatus) ?? "pending";
  return {
    id: String(booking.id ?? ""),
    spaceId: String(booking.space_id ?? ""),
    ownerId: String(booking.owner_id ?? ""),
    petIds: Array.isArray(booking.pet_ids) ? booking.pet_ids.map(String) : [],
    bookingType: (booking.booking_type as Booking["bookingType"]) ?? "overnight",
    startDate: toDate(booking.start_date as string | undefined),
    endDate: toDate(booking.end_date as string | undefined),
    startTime: typeof booking.start_time === "string" && booking.start_time ? booking.start_time : undefined,
    endTime: typeof booking.end_time === "string" && booking.end_time ? booking.end_time : undefined,
    hours: typeof booking.hours === "number" ? booking.hours : undefined,
    subtotal: Number(booking.subtotal ?? 0),
    serviceFee: Number(booking.service_fee ?? 0),
    totalPrice: Number(booking.total_price ?? 0),
    status,
    paymentStatus: status === "cancelled" ? "refunded" : "pending",
    createdAt: toDate(booking.created_at as string | undefined),
    notes: typeof booking.notes === "string" ? booking.notes : undefined,
  };
}

function mapBackendBlockedDate(value: Record<string, unknown>, spaceId: string): BlockedDate {
  const date = String(value.date ?? value.id ?? new Date().toISOString().slice(0, 10));
  return {
    id: String(value.id ?? date),
    spaceId,
    startDate: toDate(date),
    endDate: toDate(date),
    reason: typeof value.reason === "string" ? value.reason : undefined,
  };
}

function mapBackendReview(review: Record<string, unknown>): Review {
  return {
    id: String(review.id ?? ""),
    bookingId: String(review.booking_id ?? ""),
    spaceId: String(review.space_id ?? ""),
    ownerId: String(review.reviewer_id ?? review.owner_id ?? ""),
    rating: Number(review.rating ?? 0),
    comment: String(review.comment ?? ""),
    createdAt: toDate(review.created_at as string | undefined),
  };
}

function mapBackendMessage(message: Record<string, unknown>): Message {
  return {
    id: String(message.id ?? ""),
    conversationId: String(message.conv_id ?? message.conversationId ?? ""),
    senderId: String(message.sender_id ?? message.senderId ?? ""),
    body: String(message.content ?? message.body ?? ""),
    readAt: undefined,
    createdAt: toDate(message.created_at as string | undefined),
  };
}

function mapBackendConversation(conversation: Record<string, unknown>): ConversationWithDetails {
  const id = String(conversation.id ?? "");
  const ownerId = String(conversation.owner_id ?? "");
  const caregiverId = String(conversation.caregiver_id ?? "");
  const currentUserId = getCurrentUserId();
  const otherId =
    ownerId && caregiverId
      ? ownerId === currentUserId
        ? caregiverId
        : ownerId
      : "";
  const lastMessageRaw =
    typeof conversation.last_message === "object" && conversation.last_message
      ? (conversation.last_message as Record<string, unknown>)
      : undefined;
  const lastMessage = lastMessageRaw ? mapBackendMessage(lastMessageRaw) : undefined;

  return {
    id,
    spaceId: String(conversation.space_id ?? ""),
    createdAt: toDate(conversation.created_at as string | undefined),
    updatedAt: toDate(
      (lastMessageRaw?.created_at as string | undefined) ??
        (conversation.updated_at as string | undefined) ??
        new Date()
    ),
    participants: [
      ownerId
        ? { id: `${id}-${ownerId}`, conversationId: id, userId: ownerId, createdAt: toDate(conversation.created_at as string | undefined) }
        : null,
      caregiverId
        ? { id: `${id}-${caregiverId}`, conversationId: id, userId: caregiverId, createdAt: toDate(conversation.created_at as string | undefined) }
        : null,
    ].filter(Boolean) as ConversationParticipant[],
    lastMessage,
    unreadCount: 0,
    otherParticipant: otherId
      ? {
          id: otherId,
          name: otherId === currentUserId ? currentUserStore.name : `Usuario ${otherId.slice(0, 6)}`,
          avatar: "",
        }
      : undefined,
    spaceTitle: spacesStore.find((space) => space.id === String(conversation.space_id ?? ""))?.title,
  };
}

async function bootstrapProfile(accessToken: string) {
  const profile = await apiRequest<Record<string, unknown>>(
    "/auth/bootstrap",
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
    { auth: false }
  );

  const user = mapBackendUser(profile);
  currentUserStore = cloneUser(user);
  return user;
}

async function createSessionFromAuth(email: string, authResult: Record<string, unknown>) {
  const idToken = String(authResult.IdToken ?? authResult.idToken ?? "");
  const refreshToken = String(authResult.RefreshToken ?? authResult.refreshToken ?? "");
  const expiresIn = Number(authResult.ExpiresIn ?? authResult.expiresIn ?? 3600);
  const user = await bootstrapProfile(idToken);

  const session: AuthSession = {
    user,
    accessToken: idToken,
    refreshToken,
    idToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };

  currentUserStore = {
    ...cloneUser(user),
    email,
  };
  persistAuthSession(session);
  return cloneSession(session);
}

async function sendWebSocketMessage(conversationId: string, body: string, senderId: string) {
  if (!isBrowserEnvironment() || !WS_URL) {
    throw new Error("WebSocket no configurado.");
  }

  const socketUrl = `${WS_URL}?userId=${encodeURIComponent(senderId)}`;
  const payload = JSON.stringify({
    action: "sendMessage",
    conversationId,
    body,
    senderId,
  });

  return new Promise<Message>((resolve, reject) => {
    const socket = new WebSocket(socketUrl);
    const timeout = window.setTimeout(() => {
      socket.close();
      reject(new Error("Tiempo de espera agotado al enviar mensaje."));
    }, 10000);

    socket.onopen = () => {
      socket.send(payload);
    };

    socket.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("No se pudo conectar al WebSocket."));
    };

    socket.onmessage = (event) => {
      const data = safeJsonParse<{ message?: Record<string, unknown> }>(String(event.data));
      if (!data?.message) return;

      window.clearTimeout(timeout);
      socket.close();
      resolve(mapBackendMessage(data.message));
    };

    socket.onclose = () => {
      window.clearTimeout(timeout);
    };
  });
}

export const authApi = {
  async getCurrentUser() {
    if (!IS_API_CONFIGURED) {
      await delay();
      const session = getAuthSession();
      if (!session) throw new Error("No hay una sesion activa.");
      return cloneUser(session.user);
    }

    const profile = await apiRequest<Record<string, unknown>>("/me");
    const user = mapBackendUser(profile);
    currentUserStore = cloneUser(user);

    const session = getAuthSession();
    if (session) {
      persistAuthSession({ ...session, user });
    }

    return user;
  },

  async login(credentials: AuthCredentials) {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email y contrasena son obligatorios.");
    }

    if (!IS_API_CONFIGURED || !COGNITO_CLIENT_ID) {
      await delay();
      currentUserStore = {
        ...cloneUser(currentUserStore),
        email: credentials.email,
      };
      const session: AuthSession = {
        user: cloneUser(currentUserStore),
        accessToken: `placeholder-access-token-${Date.now()}`,
        refreshToken: `placeholder-refresh-token-${Date.now()}`,
      };
      persistAuthSession(session);
      return { ...cloneSession(session), provider: API_BASE_URL };
    }

    const response = await cognitoRequest<{ AuthenticationResult?: Record<string, unknown> }>(
      "AWSCognitoIdentityProviderService.InitiateAuth",
      {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: credentials.email,
          PASSWORD: credentials.password,
        },
      }
    );

    const authResult = response.AuthenticationResult;
    if (!authResult) {
      throw new Error("Cognito no devolvio tokens de sesion.");
    }

    const session = await createSessionFromAuth(credentials.email, authResult);
    return { ...session, provider: API_BASE_URL };
  },

  async register(input: RegisterInput) {
    if (!input.name || !input.email || !input.password) {
      throw new Error("Nombre, email y contrasena son obligatorios.");
    }

    if (!IS_API_CONFIGURED || !COGNITO_CLIENT_ID) {
      await delay();
      currentUserStore = {
        ...cloneUser(currentUserStore),
        name: input.name,
        email: input.email,
        phone: input.phone,
      };
      const session: AuthSession = {
        user: cloneUser(currentUserStore),
        accessToken: `placeholder-access-token-${Date.now()}`,
        refreshToken: `placeholder-refresh-token-${Date.now()}`,
      };
      persistAuthSession(session);
      return { user: cloneUser(currentUserStore), confirmed: true };
    }

    const response = await cognitoRequest<{ UserConfirmed?: boolean }>(
      "AWSCognitoIdentityProviderService.SignUp",
      {
        ClientId: COGNITO_CLIENT_ID,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: "email", Value: input.email },
          { Name: "name", Value: input.name },
        ],
      }
    );

    return {
      confirmed: Boolean(response.UserConfirmed),
      user: {
        ...cloneUser(mockUser),
        id: input.email,
        email: input.email,
        name: input.name,
        phone: input.phone,
      },
    };
  },

  async confirmSignUp(email: string, code: string) {
    if (!email || !code) {
      throw new Error("Debes indicar el email y el codigo de verificacion.");
    }

    if (!IS_API_CONFIGURED || !COGNITO_CLIENT_ID) {
      await delay();
      return { email, confirmed: true as const, provider: API_BASE_URL };
    }

    await cognitoRequest(
      "AWSCognitoIdentityProviderService.ConfirmSignUp",
      {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }
    );

    return { email, confirmed: true as const, provider: API_BASE_URL };
  },

  async resendSignUpCode(email: string) {
    if (!email) {
      throw new Error("Debes indicar el email para reenviar el codigo.");
    }

    if (!IS_API_CONFIGURED || !COGNITO_CLIENT_ID) {
      await delay();
      return { email, status: "sent" as const, provider: API_BASE_URL };
    }

    await cognitoRequest(
      "AWSCognitoIdentityProviderService.ResendConfirmationCode",
      {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
      }
    );

    return { email, status: "sent" as const, provider: API_BASE_URL };
  },

  async updateProfile(input: {
    name?: string;
    bio?: string;
    phone?: string;
    avatarUrl?: string;
    role?: UserRole;
  }) {
    if (!IS_API_CONFIGURED) {
      await delay();
      currentUserStore = {
        ...cloneUser(currentUserStore),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
      };
      return cloneUser(currentUserStore);
    }

    const data = await apiRequest<Record<string, unknown>>("/me/profile", {
      method: "PUT",
      body: JSON.stringify({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
      }),
    });

    const user = mapBackendUser(data);
    currentUserStore = cloneUser(user);
    const session = getAuthSession();
    if (session) {
      persistAuthSession({ ...session, user });
    }
    return user;
  },

  async requestPasswordReset(email: string) {
    if (!email) {
      throw new Error("Debes indicar un email para restablecer la contrasena.");
    }

    if (!IS_API_CONFIGURED || !COGNITO_CLIENT_ID) {
      await delay();
      return { email, status: "sent" as const, provider: API_BASE_URL };
    }

    await cognitoRequest(
      "AWSCognitoIdentityProviderService.ForgotPassword",
      { ClientId: COGNITO_CLIENT_ID, Username: email }
    );

    return { email, status: "sent" as const, provider: API_BASE_URL };
  },

  async logout() {
    await delay();
    persistAuthSession(null);
    return { success: true };
  },
};

export const spacesApi = {
  async list(filters?: SpaceFilters) {
    if (!IS_API_CONFIGURED) {
      await delay();
      let results = spacesStore.filter((space) =>
        filters?.onlyActive === false ? true : space.isActive
      );
      if (filters?.province) results = results.filter((space) => space.province === filters.province);
      if (filters?.canton) results = results.filter((space) => space.canton === filters.canton);
      if (filters?.petType) {
        results = results.filter((space) => space.acceptedPetTypes.includes(filters.petType!));
      }
      if (typeof filters?.maxNightPrice === "number") {
        results = results.filter((space) => space.pricePerNight <= filters.maxNightPrice!);
      }
      if (filters?.caregiverId) {
        results = results.filter((space) => space.caregiverId === filters.caregiverId);
      }
      return results.map(cloneSpace);
    }

    const params = new URLSearchParams();
    if (filters?.province) params.set("province", toBackendProvince(filters.province));
    if (filters?.canton) params.set("canton", filters.canton);
    if (filters?.petType) params.set("petType", filters.petType);

    const data = await apiRequest<Record<string, unknown>[]>(
      `/spaces${params.size ? `?${params.toString()}` : ""}`
    );
    const spaces = Array.isArray(data) ? data.map(mapBackendSpace) : [];
    spacesStore = spaces.map(cloneSpace);
    return spaces;
  },

  async getById(spaceId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return cloneSpace(
        requireEntity(spacesStore.find((space) => space.id === spaceId), "Espacio no encontrado.")
      );
    }

    const data = await apiRequest<{ space: Record<string, unknown> }>(`/spaces/${spaceId}`);
    const space = mapBackendSpace(data.space);
    spacesStore = [space, ...spacesStore.filter((item) => item.id !== space.id)];
    return space;
  },

  async getMine() {
    if (!IS_API_CONFIGURED) {
      await delay();
      return spacesStore
        .filter((space) => space.caregiverId === mockCaregiverProfile.id)
        .map(cloneSpace);
    }

    const data = await apiRequest<Record<string, unknown>[]>("/caregiver/spaces");
    const spaces = Array.isArray(data) ? data.map(mapBackendSpace) : [];
    spacesStore = [...spaces, ...spacesStore.filter((space) => !spaces.some((item) => item.id === space.id))];
    return spaces;
  },

  async create(input: Omit<Space, "id" | "createdAt" | "rating" | "reviewCount">) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const newSpace: Space = {
        ...input,
        id: createId("space"),
        createdAt: new Date(),
        rating: 0,
        reviewCount: 0,
      };
      spacesStore = [newSpace, ...spacesStore];
      return cloneSpace(newSpace);
    }

    const data = await apiRequest<Record<string, unknown>>("/caregiver/spaces", {
      method: "POST",
      body: JSON.stringify({
        name: input.title,
        description: input.description,
        province: toBackendProvince(input.province),
        canton: input.canton,
        address: input.address,
        accepted_pet_types: input.acceptedPetTypes,
        price_per_night: input.pricePerNight,
        price_per_hour: input.pricePerHour,
        max_pets: input.maxPets,
      }),
    });
    const space = mapBackendSpace(data);
    spacesStore = [space, ...spacesStore.filter((item) => item.id !== space.id)];
    return space;
  },

  async update(spaceId: string, patch: Partial<Omit<Space, "id" | "createdAt">>) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const existing = requireEntity(
        spacesStore.find((space) => space.id === spaceId),
        "No se puede actualizar un espacio inexistente."
      );
      const updated: Space = { ...existing, ...patch };
      spacesStore = spacesStore.map((space) => (space.id === spaceId ? updated : space));
      return cloneSpace(updated);
    }

    const body: Record<string, unknown> = {};
    if (patch.title !== undefined) body.name = patch.title;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.province !== undefined) body.province = toBackendProvince(patch.province);
    if (patch.canton !== undefined) body.canton = patch.canton;
    if (patch.address !== undefined) body.address = patch.address;
    if (patch.acceptedPetTypes !== undefined) body.accepted_pet_types = patch.acceptedPetTypes;
    if (patch.pricePerNight !== undefined) body.price_per_night = patch.pricePerNight;
    if (patch.pricePerHour !== undefined) body.price_per_hour = patch.pricePerHour;
    if (patch.maxPets !== undefined) body.max_pets = patch.maxPets;
    if (patch.isActive !== undefined) body.is_active = patch.isActive;
    if (patch.photos !== undefined) body.photos = patch.photos;

    const data = await apiRequest<Record<string, unknown>>(`/caregiver/spaces/${spaceId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const space = mapBackendSpace(data);
    spacesStore = [space, ...spacesStore.filter((item) => item.id !== space.id)];
    return space;
  },

  async remove(spaceId: string) {
    await delay();
    spacesStore = spacesStore.filter((space) => space.id !== spaceId);
    return { success: true };
  },
};

export const bookingsApi = {
  async listMine() {
    if (!IS_API_CONFIGURED) {
      await delay();
      return bookingsStore
        .filter((booking) => booking.ownerId === currentUserStore.id)
        .map(cloneBooking);
    }

    const data = await apiRequest<Record<string, unknown>[]>("/owner/bookings");
    return Array.isArray(data) ? data.map(mapBackendBooking) : [];
  },

  async getById(bookingId: string) {
    await delay();
    return cloneBooking(
      requireEntity(bookingsStore.find((booking) => booking.id === bookingId), "Reservacion no encontrada.")
    );
  },

  async create(input: CreateBookingInput) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const newBooking: Booking = {
        id: createId("booking"),
        spaceId: input.spaceId,
        ownerId: input.ownerId,
        petIds: [...input.petIds],
        bookingType: input.bookingType,
        startDate: cloneDate(input.startDate),
        endDate: cloneDate(input.endDate),
        startTime: input.startTime,
        endTime: input.endTime,
        hours: input.hours,
        subtotal: input.subtotal,
        serviceFee: input.serviceFee,
        totalPrice: input.totalPrice,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        notes: input.notes,
      };
      bookingsStore = [newBooking, ...bookingsStore];
      return cloneBooking(newBooking);
    }

    const data = await apiRequest<Record<string, unknown>>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        space_id: input.spaceId,
        pet_ids: input.petIds,
        booking_type: input.bookingType,
        start_date: toDateOnly(input.startDate),
        end_date: toDateOnly(input.endDate),
        start_time: input.startTime,
        end_time: input.endTime,
        hours: input.hours,
        subtotal: input.subtotal,
        notes: input.notes,
      }),
    });

    return mapBackendBooking(data);
  },

  async updateStatus(bookingId: string, status: BookingStatus) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const booking = requireEntity(
        bookingsStore.find((item) => item.id === bookingId),
        "No se puede actualizar una reservacion inexistente."
      );
      const updated: Booking = { ...booking, status };
      bookingsStore = bookingsStore.map((item) => (item.id === bookingId ? updated : item));
      return cloneBooking(updated);
    }

    if (status !== "cancelled") {
      throw new Error("Solo se soporta cancelar reservaciones en la API real.");
    }

    const data = await apiRequest<Record<string, unknown>>(`/bookings/${bookingId}/cancel`, {
      method: "POST",
    });
    return mapBackendBooking(data);
  },
};

export const petsApi = {
  async listMine() {
    if (!IS_API_CONFIGURED) {
      await delay();
      return petsStore.filter((pet) => pet.ownerId === currentUserStore.id).map(clonePet);
    }

    const data = await apiRequest<Record<string, unknown>[]>("/owner/pets");
    return Array.isArray(data) ? data.map(mapBackendPet) : [];
  },

  async create(input: Omit<Pet, "id">) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const newPet: Pet = { ...input, id: createId("pet"), photos: [...input.photos] };
      petsStore = [newPet, ...petsStore];
      return clonePet(newPet);
    }

    const data = await apiRequest<Record<string, unknown>>("/owner/pets", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        species: input.type,
        breed: input.breed,
        age: input.age,
        photos: input.photos,
        medical_notes: input.specialNeeds,
      }),
    });
    return mapBackendPet(data);
  },

  async update(petId: string, patch: Partial<Omit<Pet, "id" | "ownerId">>) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const pet = requireEntity(petsStore.find((item) => item.id === petId), "Mascota no encontrada.");
      const updated: Pet = { ...pet, ...patch, photos: patch.photos ? [...patch.photos] : [...pet.photos] };
      petsStore = petsStore.map((item) => (item.id === petId ? updated : item));
      return clonePet(updated);
    }

    const data = await apiRequest<Record<string, unknown>>(`/owner/pets/${petId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.type !== undefined ? { species: patch.type } : {}),
        ...(patch.breed !== undefined ? { breed: patch.breed } : {}),
        ...(patch.age !== undefined ? { age: patch.age } : {}),
        ...(patch.photos !== undefined ? { photos: patch.photos } : {}),
        ...(patch.specialNeeds !== undefined ? { medical_notes: patch.specialNeeds } : {}),
      }),
    });
    return mapBackendPet(data);
  },

  async remove(petId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      petsStore = petsStore.filter((pet) => pet.id !== petId);
      return { success: true };
    }

    await apiRequest(`/owner/pets/${petId}`, { method: "DELETE" });
    return { success: true };
  },
};

export const reviewsApi = {
  async listForSpace(spaceId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return reviewsStore
        .filter((review) => review.spaceId === spaceId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(cloneReview);
    }

    const data = await apiRequest<Record<string, unknown>[]>(`/spaces/${spaceId}/reviews`);
    return Array.isArray(data) ? data.map(mapBackendReview) : [];
  },

  async create(input: Omit<Review, "id" | "createdAt">) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const review: Review = { ...input, id: createId("review"), createdAt: new Date() };
      reviewsStore = [review, ...reviewsStore];
      return cloneReview(review);
    }

    const data = await apiRequest<Record<string, unknown>>(`/spaces/${input.spaceId}/reviews`, {
      method: "POST",
      body: JSON.stringify({
        booking_id: input.bookingId,
        rating: input.rating,
        comment: input.comment,
      }),
    });
    return mapBackendReview(data);
  },
};

export const availabilityApi = {
  async list(spaceId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return blockedDatesStore.filter((blockedDate) => blockedDate.spaceId === spaceId).map(cloneBlockedDate);
    }

    const data = await apiRequest<{ blockedDates?: Record<string, unknown>[] }>(`/spaces/${spaceId}`);
    const blockedDates = Array.isArray(data.blockedDates)
      ? data.blockedDates.map((item) => mapBackendBlockedDate(item, spaceId))
      : [];
    return blockedDates;
  },

  async blockDates(input: Omit<BlockedDate, "id">) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const blockedDate: BlockedDate = {
        ...input,
        id: createId("blocked"),
        startDate: cloneDate(input.startDate),
        endDate: cloneDate(input.endDate),
      };
      blockedDatesStore = [...blockedDatesStore, blockedDate];
      return cloneBlockedDate(blockedDate);
    }

    const data = await apiRequest<Record<string, unknown>>(
      `/caregiver/spaces/${input.spaceId}/blocked-dates`,
      {
        method: "POST",
        body: JSON.stringify({
          date: toDateOnly(input.startDate),
          reason: input.reason,
        }),
      }
    );
    return mapBackendBlockedDate(data, input.spaceId);
  },

  async unblockDate(blockedDateId: string, spaceId?: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      blockedDatesStore = blockedDatesStore.filter((blockedDate) => blockedDate.id !== blockedDateId);
      return { success: true };
    }

    if (!spaceId) {
      throw new Error("Se requiere el ID del espacio para desbloquear fechas.");
    }

    await apiRequest(`/caregiver/spaces/${spaceId}/blocked-dates/${blockedDateId}`, {
      method: "DELETE",
    });
    return { success: true };
  },
};

function normalizeUploadContentType(fileName: string, contentType?: string) {
  if (contentType === "image/jpeg" || contentType === "image/png" || contentType === "image/webp") {
    return contentType;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "png"
    ? "image/png"
    : extension === "webp"
      ? "image/webp"
      : "image/jpeg";
}

async function requestUpload(category: "space" | "pet", fileName: string, contentType?: string) {
  const normalizedContentType = normalizeUploadContentType(fileName, contentType);

  const data = await apiRequest<{ key: string; url: string; publicUrl?: string }>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ category, contentType: normalizedContentType }),
  });

  return {
    key: data.key,
    url: data.publicUrl ?? data.url,
    uploadUrl: data.url,
  } satisfies UploadResult;
}

async function uploadFileToSignedUrl(uploadUrl: string, file: File, contentType: string) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error("No se pudo subir la imagen a S3.");
  }
}

export const uploadApi = {
  async uploadSpacePhoto(fileName: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return {
        key: `spaces/${createId("photo")}-${fileName}`,
        url: `https://placeholder.donver.cr/spaces/${encodeURIComponent(fileName)}`,
      } satisfies UploadResult;
    }
    return requestUpload("space", fileName);
  },

  async uploadSpaceFile(file: File) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return {
        key: `spaces/${createId("photo")}-${file.name}`,
        url: URL.createObjectURL(file),
      } satisfies UploadResult;
    }

    const contentType = normalizeUploadContentType(file.name, file.type);
    const upload = await requestUpload("space", file.name, contentType);
    if (upload.uploadUrl) {
      await uploadFileToSignedUrl(upload.uploadUrl, file, contentType);
    }
    return upload;
  },

  async uploadPetPhoto(fileName: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return {
        key: `pets/${createId("photo")}-${fileName}`,
        url: `https://placeholder.donver.cr/pets/${encodeURIComponent(fileName)}`,
      } satisfies UploadResult;
    }
    return requestUpload("pet", fileName);
  },

  async uploadPetFile(file: File) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return {
        key: `pets/${createId("photo")}-${file.name}`,
        url: URL.createObjectURL(file),
      } satisfies UploadResult;
    }

    const contentType = normalizeUploadContentType(file.name, file.type);
    const upload = await requestUpload("pet", file.name, contentType);
    if (upload.uploadUrl) {
      await uploadFileToSignedUrl(upload.uploadUrl, file, contentType);
    }
    return upload;
  },
};

export const messagesApi = {
  async listConversations() {
    if (!IS_API_CONFIGURED) {
      await delay();
      return conversationsStore
        .slice()
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map(getConversationDetails);
    }

    const data = await apiRequest<Record<string, unknown>[]>("/messages/conversations");
    return Array.isArray(data) ? data.map(mapBackendConversation) : [];
  },

  async listMessages(conversationId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return messagesStore
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(cloneMessage);
    }

    const data = await apiRequest<Record<string, unknown>[]>(
      `/messages/conversations/${conversationId}/messages`
    );
    return Array.isArray(data) ? data.map(mapBackendMessage) : [];
  },

  async sendMessage(conversationId: string, body: string, senderId = getCurrentUserId()) {
    if (!body.trim()) {
      throw new Error("El mensaje no puede estar vacio.");
    }

    if (!IS_API_CONFIGURED) {
      await delay();
      const newMessage: Message = {
        id: createId("msg"),
        conversationId,
        senderId,
        body: body.trim(),
        createdAt: new Date(),
      };
      messagesStore = [...messagesStore, newMessage];
      return cloneMessage(newMessage);
    }

    return sendWebSocketMessage(conversationId, body.trim(), senderId);
  },

  async markConversationAsRead(conversationId: string, userId = getCurrentUserId()) {
    await delay();

    let updatedCount = 0;
    messagesStore = messagesStore.map((message) => {
      if (message.conversationId === conversationId && message.senderId !== userId && !message.readAt) {
        updatedCount += 1;
        return { ...message, readAt: new Date() };
      }
      return message;
    });

    return { updatedCount };
  },
};

export const paymentsApi = {
  async createCheckoutSession(bookingId: string) {
    await delay();

    const booking = requireEntity(
      bookingsStore.find((item) => item.id === bookingId),
      "No se encontro la reservacion para procesar el pago."
    );

    booking.paymentStatus = "paid";

    return {
      bookingId,
      amount: booking.totalPrice,
      currency: "CRC",
      status: booking.paymentStatus,
      checkoutUrl: `https://payments.placeholder.donver.cr/checkout/${bookingId}`,
    } satisfies PaymentIntent;
  },

  async getPaymentStatus(bookingId: string) {
    await delay();

    const booking = requireEntity(
      bookingsStore.find((item) => item.id === bookingId),
      "No se encontro la reservacion para consultar el pago."
    );

    return {
      bookingId,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
    };
  },

  async refundBooking(bookingId: string) {
    await delay();

    const booking = requireEntity(
      bookingsStore.find((item) => item.id === bookingId),
      "No se encontro la reservacion para reembolsar."
    );

    booking.paymentStatus = "refunded";
    booking.status = "cancelled";

    return {
      bookingId,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
    };
  },
};
