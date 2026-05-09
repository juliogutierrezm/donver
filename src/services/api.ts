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
import {
  calculateBookingPricing,
  DEFAULT_ADDITIONAL_PET_RATE,
  type BookingPricingBreakdown,
} from "@/lib/bookingPricing";
import type {
  Conversation,
  ConversationParticipant,
  ConversationWithDetails,
  Message,
} from "@/types/messaging";
import { mockUser, mockSpaces } from "@/data/mockData";
import { mockFavoriteSpaceIds, mockPets, mockBookings } from "@/data/mockProfileData";
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
import { APP_ROUTES } from "@/lib/routes";

const API_PLACEHOLDER_BASE_URL = "aws-placeholder://donver-phase-12";
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
const LEGACY_AUTH_SESSION_STORAGE_KEY = "donver.auth.session";
const AUTH_SESSION_STORAGE_KEY = [
  LEGACY_AUTH_SESSION_STORAGE_KEY,
  API_BASE_URL || "no-api",
  COGNITO_USER_POOL_ID || "no-pool",
  COGNITO_CLIENT_ID || "no-client",
].join(":");

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
  province: Province;
  canton: string;
  signupIntent?: "caregiver" | null;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt?: string;
  activeRole?: UserRole;
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

export interface BookingPartySummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface BookingSpaceSummary {
  id: string;
  title: string;
  province?: Province;
  canton?: string;
  address?: string;
}

export interface BookingPetSummary {
  id: string;
  name: string;
  type: PetType;
  breed?: string;
  size?: PetSize;
  age?: number;
  description?: string;
  photos?: string[];
  specialNeeds?: string;
}

export interface BookingDetail extends Booking {
  caregiverId?: string;
  updatedAt?: Date;
  pricing?: BookingPricingBreakdown;
  space?: BookingSpaceSummary;
  pets?: BookingPetSummary[];
  owner?: BookingPartySummary;
  caregiver?: BookingPartySummary;
  canReview?: boolean;
  reviewSubmitted?: boolean;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
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
  return {
    ...user,
    createdAt: cloneDate(user.createdAt),
    caregiverStatus: user.caregiverStatus
      ? {
          ...user.caregiverStatus,
          missingProfileFields: [...user.caregiverStatus.missingProfileFields],
        }
      : undefined,
  };
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
    spaceName: booking.spaceName,
    ownerName: booking.ownerName,
    caregiverName: booking.caregiverName,
    petIds: [...booking.petIds],
    startDate: cloneDate(booking.startDate),
    endDate: cloneDate(booking.endDate),
    createdAt: cloneDate(booking.createdAt),
  };
}

function cloneBookingDetail(booking: BookingDetail): BookingDetail {
  return {
    ...cloneBooking(booking),
    caregiverId: booking.caregiverId,
    updatedAt: booking.updatedAt ? cloneDate(booking.updatedAt) : undefined,
    pricing: booking.pricing ? { ...booking.pricing } : undefined,
    space: booking.space ? { ...booking.space } : undefined,
    pets: booking.pets ? booking.pets.map((pet) => ({ ...pet })) : undefined,
    owner: booking.owner ? { ...booking.owner } : undefined,
    caregiver: booking.caregiver ? { ...booking.caregiver } : undefined,
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

function normalizeRoles(value: unknown): UserRole[] {
  const roles =
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value
        : [];
  const normalized: UserRole[] = roles.flatMap((role) => {
    const value = String(role);
    if (value === "both") return ["owner", "caregiver"] as UserRole[];
    return value === "owner" || value === "caregiver" ? [value] : [];
  });

  return Array.from(new Set(normalized));
}

function isOwnerProfileActive(value: unknown) {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return true;
}

function deriveActiveRole(
  roles: UserRole[],
  activeRole?: unknown,
  signupIntent?: "caregiver" | null
): UserRole {
  const candidate = typeof activeRole === "string" ? activeRole : "";
  if ((candidate === "owner" || candidate === "caregiver") && roles.includes(candidate)) {
    return candidate;
  }
  if (roles.length === 0 && signupIntent === "caregiver") {
    return "caregiver";
  }
  return roles[0] ?? "owner";
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
  if (
    value === "dog" ||
    value === "cat" ||
    value === "bird" ||
    value === "rabbit" ||
    value === "hamster" ||
    value === "snake" ||
    value === "reptile" ||
    value === "fish" ||
    value === "other"
  ) {
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

function decodeJwtPayload(token?: string) {
  if (!token || !isBrowserEnvironment()) return null;

  const [, payload = ""] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return safeJsonParse<Record<string, unknown>>(window.atob(padded));
  } catch {
    return null;
  }
}

function getSessionExpiryMs(session?: AuthSession | null) {
  if (!session) return null;

  if (session.expiresAt) {
    const timestamp = Date.parse(session.expiresAt);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  const payload = decodeJwtPayload(session.idToken ?? session.accessToken);
  const exp = typeof payload?.exp === "number" ? payload.exp : undefined;
  return exp ? exp * 1000 : null;
}

function isSessionExpired(session?: AuthSession | null, skewMs = 60_000) {
  if (!session?.accessToken) return true;
  if (!IS_API_CONFIGURED || !COGNITO_CLIENT_ID) return false;

  const expiryMs = getSessionExpiryMs(session);
  if (!expiryMs) return false;
  return expiryMs <= Date.now() + skewMs;
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
let refreshAuthSessionPromise: Promise<AuthSession | null> | null = null;

function persistAuthSession(session: AuthSession | null) {
  authSessionStore = session ? cloneSession(session) : null;
  if (!isBrowserEnvironment()) return;

  if (AUTH_SESSION_STORAGE_KEY !== LEGACY_AUTH_SESSION_STORAGE_KEY) {
    window.localStorage.removeItem(LEGACY_AUTH_SESSION_STORAGE_KEY);
  }

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

export type UserExperienceMode = "owner" | "caregiver_pending" | "caregiver" | "both";

export function getUserExperienceMode(user?: Pick<User, "roles" | "signupIntent"> | null): UserExperienceMode {
  if (!user) return "owner";
  const hasOwnerRole = user.roles.includes("owner");
  const hasCaregiverRole = user.roles.includes("caregiver");
  if (hasOwnerRole && hasCaregiverRole) return "both";
  if (hasCaregiverRole) return "caregiver";
  if (user.signupIntent === "caregiver") return "caregiver_pending";
  return "owner";
}

export function getDefaultPostAuthPath(user?: Pick<User, "roles" | "signupIntent"> | null, next?: string) {
  if (next?.trim()) return next.trim();

  const mode = getUserExperienceMode(user);
  if (mode === "caregiver_pending") return APP_ROUTES.becomeCaregiver;
  if (mode === "caregiver" || mode === "both") return APP_ROUTES.caregiverDashboard;
  return APP_ROUTES.profile;
}

export function getCurrentUserId() {
  return authSessionStore?.user.id ?? currentUserStore.id;
}

export function isAuthenticated() {
  return Boolean(authSessionStore?.accessToken) && !isSessionExpired(authSessionStore, 0);
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
let favoriteSpaceIdsStore = [...mockFavoriteSpaceIds];
let reviewsStore: Review[] = [
  {
    id: "review-1",
    bookingId: "booking-1",
    spaceId: "space-1",
    reviewerName: "María Fernanda",
    rating: 5,
    comment: "Excelente espacio, mi perro lo paso increible. Muy atento el cuidador.",
    createdAt: new Date("2024-04-08"),
  },
  {
    id: "review-2",
    bookingId: "booking-2",
    spaceId: "space-1",
    reviewerName: "Carlos Jiménez",
    rating: 4,
    comment: "Muy buen lugar, limpio y con comunicacion rapida.",
    createdAt: new Date("2024-04-14"),
  },
  {
    id: "review-3",
    bookingId: "booking-3",
    spaceId: "space-2",
    reviewerName: currentUserStore.name,
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

function hasMockBookingEnded(booking: Booking) {
  const bookingEnd = new Date(booking.endDate);
  if (booking.bookingType === "hourly" && booking.endTime) {
    const [hours, minutes] = booking.endTime.split(":").map(Number);
    bookingEnd.setHours(Number.isFinite(hours) ? hours : 23, Number.isFinite(minutes) ? minutes : 59, 0, 0);
    return Date.now() > bookingEnd.getTime();
  }

  bookingEnd.setHours(23, 59, 59, 999);
  return Date.now() > bookingEnd.getTime();
}

function recalculateMockSpaceReviews(spaceId: string) {
  const spaceReviews = reviewsStore.filter((review) => review.spaceId === spaceId);
  const reviewCount = spaceReviews.length;
  const rating =
    reviewCount > 0
      ? Math.round((spaceReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10) / 10
      : 0;

  spacesStore = spacesStore.map((space) =>
    space.id === spaceId
      ? {
          ...space,
          rating,
          reviewCount,
        }
      : space
  );
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

async function parseResponse(res: Response) {
  const text = await res.text();
  const json = text ? safeJsonParse<unknown>(text) : null;

  if (!res.ok) {
    const message =
      typeof json === "object" && json && "error" in json && typeof json.error === "string"
        ? json.error
        : typeof json === "object" && json && "message" in json && typeof json.message === "string"
          ? json.message
        : text || `Error ${res.status}`;
    throw new ApiError(message, res.status, json);
  }

  return json;
}

async function refreshStoredSession() {
  const session = getAuthSession();
  if (!session?.refreshToken || !COGNITO_CLIENT_ID) {
    persistAuthSession(null);
    return null;
  }

  try {
    const response = await cognitoRequest<{ AuthenticationResult?: Record<string, unknown> }>(
      "AWSCognitoIdentityProviderService.InitiateAuth",
      {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          REFRESH_TOKEN: session.refreshToken,
        },
      }
    );

    const authResult = response.AuthenticationResult;
    if (!authResult) {
      throw new Error("Cognito no devolvio tokens de sesion.");
    }

    const idToken = String(
      authResult.IdToken ?? authResult.idToken ?? session.idToken ?? session.accessToken ?? ""
    );
    const expiresIn = Number(authResult.ExpiresIn ?? authResult.expiresIn ?? 3600);
    const user = await bootstrapProfile(idToken);
    const activeRole = deriveActiveRole(
      user.roles,
      user.activeRole ?? session.activeRole,
      user.signupIntent ?? session.user.signupIntent
    );

    const refreshedSession: AuthSession = {
      ...session,
      user,
      accessToken: idToken,
      idToken,
      refreshToken: session.refreshToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      activeRole,
    };

    currentUserStore = cloneUser(user);
    persistAuthSession(refreshedSession);
    return cloneSession(refreshedSession);
  } catch {
    persistAuthSession(null);
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }
}

async function getValidAuthSession(options?: { forceRefresh?: boolean }) {
  const session = getAuthSession();
  if (!session) return null;

  if (!options?.forceRefresh && !isSessionExpired(session)) {
    return session;
  }

  if (!refreshAuthSessionPromise) {
    refreshAuthSessionPromise = refreshStoredSession().finally(() => {
      refreshAuthSessionPromise = null;
    });
  }

  return refreshAuthSessionPromise;
}

async function ensureValidSession() {
  const session = await getValidAuthSession();
  if (!session) {
    throw new Error("Debes iniciar sesion para continuar.");
  }
  return session;
}

export async function restoreAuthSession() {
  return getValidAuthSession();
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { auth?: boolean }
): Promise<T> {
  ensureConfigured();
  const auth = options?.auth ?? true;
  const isJsonBody =
    init?.body !== undefined &&
    init.body !== null &&
    typeof init.body === "string";

  const execute = async (session?: AuthSession | null) => {
    const headers = new Headers(init?.headers ?? {});

    if (auth) {
      const currentSession = session ?? (await ensureValidSession());
      headers.set("Authorization", `Bearer ${currentSession.accessToken}`);
    }

    if (isJsonBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      ...init,
      headers,
    });
  };

  let session = auth ? await ensureValidSession() : null;
  let res = await execute(session);

  if (auth && res.status === 401) {
    session = await getValidAuthSession({ forceRefresh: true });
    if (!session) {
      throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
    }

    res = await execute(session);
    if (res.status === 401) {
      persistAuthSession(null);
      throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
    }
  }

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
  const signupIntent = profile.signup_intent === "caregiver" ? "caregiver" : null;
  const rawRoles = normalizeRoles(profile.roles ?? profile.role ?? []);
  const roles = isOwnerProfileActive(profile.owner_profile_active)
    ? rawRoles
    : rawRoles.filter((role) => role !== "owner");
  const activeRole = deriveActiveRole(roles, profile.active_role ?? profile.activeRole, signupIntent);
  const caregiverStatusRaw =
    typeof profile.caregiver_status === "object" && profile.caregiver_status
      ? (profile.caregiver_status as Record<string, unknown>)
      : undefined;

  return {
    id: String(profile.sub ?? profile.id ?? ""),
    email: String(profile.email ?? ""),
    name: String(profile.name ?? profile.email ?? "Usuario Donver"),
    phone: typeof profile.phone === "string" ? profile.phone : undefined,
    bio: typeof profile.bio === "string" ? profile.bio : undefined,
    roles,
    activeRole,
    avatar: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
    createdAt: toDate((profile.created_at as string | undefined) ?? new Date()),
    province: normalizeProvince(profile.province as string | undefined),
    canton: typeof profile.canton === "string" && profile.canton ? profile.canton : "San Jose",
    signupIntent,
    caregiverStatus: caregiverStatusRaw
      ? {
          profileComplete: Boolean(caregiverStatusRaw.profile_complete),
          operationalReady: Boolean(caregiverStatusRaw.operational_ready),
          missingProfileFields: Array.isArray(caregiverStatusRaw.missing_profile_fields)
            ? caregiverStatusRaw.missing_profile_fields.map(String)
            : [],
          hasPublishableSpace: Boolean(caregiverStatusRaw.has_publishable_space),
        }
      : undefined,
  };
}

function mapBackendSpace(space: Record<string, unknown>): Space {
  const photos = Array.isArray(space.photos) ? space.photos.map(String) : [];
  const latitude =
    typeof space.latitude === "number"
      ? space.latitude
      : typeof space.latitude === "string" && space.latitude.trim()
        ? Number(space.latitude)
        : Number.NaN;
  const longitude =
    typeof space.longitude === "number"
      ? space.longitude
      : typeof space.longitude === "string" && space.longitude.trim()
        ? Number(space.longitude)
        : Number.NaN;

  return {
    id: String(space.id ?? ""),
    caregiverId: String(space.caregiver_id ?? ""),
    title: String(space.name ?? space.title ?? "Espacio"),
    description: String(space.description ?? ""),
    photos,
    province: normalizeProvince(space.province as string | undefined),
    canton: String(space.canton ?? "San Jose"),
    district: typeof space.district === "string" ? space.district : undefined,
    address: String(space.address ?? ""),
    formattedAddress:
      typeof space.formatted_address === "string"
        ? space.formatted_address
        : typeof space.formattedAddress === "string"
          ? space.formattedAddress
          : undefined,
    latitude,
    longitude,
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
  const spaceName =
    (typeof booking.space_name === "string" && booking.space_name.trim()) ||
    (typeof booking.spaceName === "string" && booking.spaceName.trim()) ||
    undefined;
  const ownerName =
    (typeof booking.owner_name === "string" && booking.owner_name.trim()) ||
    (typeof booking.ownerName === "string" && booking.ownerName.trim()) ||
    undefined;
  const caregiverName =
    (typeof booking.caregiver_name === "string" && booking.caregiver_name.trim()) ||
    (typeof booking.caregiverName === "string" && booking.caregiverName.trim()) ||
    undefined;

  return {
    id: String(booking.id ?? ""),
    spaceId: String(booking.space_id ?? ""),
    ownerId: String(booking.owner_id ?? ""),
    spaceName,
    ownerName,
    caregiverName,
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

function mapBookingPartySummary(value: unknown): BookingPartySummary | undefined {
  if (typeof value !== "object" || !value) return undefined;
  const party = value as Record<string, unknown>;
  const name =
    (typeof party.name === "string" && party.name) ||
    (typeof party.full_name === "string" && party.full_name) ||
    (typeof party.fullName === "string" && party.fullName) ||
    (typeof party.email === "string" && party.email) ||
    "Usuario Donver";

    return {
      id: String(party.id ?? ""),
      name: name,
      email:
        typeof party.email === "string" && party.email.trim()
          ? party.email
          : undefined,
      phone:
        typeof party.phone === "string" && party.phone.trim()
          ? party.phone
          : undefined,
      avatarUrl:
        typeof party.avatar_url === "string" && party.avatar_url
          ? party.avatar_url
        : undefined,
  };
}

function mapBookingSpaceSummary(value: unknown): BookingSpaceSummary | undefined {
  if (typeof value !== "object" || !value) return undefined;
  const space = value as Record<string, unknown>;

  return {
    id: String(space.id ?? ""),
    title: String(space.name ?? space.title ?? ""),
    province: typeof space.province === "string" ? normalizeProvince(space.province) : undefined,
    canton: typeof space.canton === "string" ? space.canton : undefined,
    address: typeof space.address === "string" ? space.address : undefined,
  };
}

function mapBookingPetSummary(value: unknown): BookingPetSummary | undefined {
  if (typeof value !== "object" || !value) return undefined;
  const pet = value as Record<string, unknown>;

    return {
      id: String(pet.id ?? ""),
      name: String(pet.name ?? ""),
      type: normalizePetType(String(pet.species ?? pet.type ?? "other")),
      breed: typeof pet.breed === "string" && pet.breed ? pet.breed : undefined,
      size: typeof pet.size === "string" && pet.size ? normalizePetSize(pet.size) : undefined,
      age: typeof pet.age === "number" ? pet.age : undefined,
      description: typeof pet.description === "string" && pet.description ? pet.description : undefined,
      photos: Array.isArray(pet.photos) ? pet.photos.map(String) : undefined,
      specialNeeds:
        typeof pet.medical_notes === "string" && pet.medical_notes
          ? pet.medical_notes
          : typeof pet.specialNeeds === "string" && pet.specialNeeds
            ? pet.specialNeeds
            : undefined,
    };
  }

function mapBackendBookingDetail(booking: Record<string, unknown>): BookingDetail {
  const baseBooking = mapBackendBooking(booking);
  const petCount = Array.isArray(booking.pet_ids) ? booking.pet_ids.length : baseBooking.petIds.length;
  const pricing =
    typeof booking.space === "object" && booking.space
      ? calculateBookingPricing({
          bookingType: baseBooking.bookingType,
          startDate: baseBooking.startDate,
          endDate: baseBooking.endDate,
          pricePerNight: Number((booking.space as Record<string, unknown>).price_per_night ?? 0),
          pricePerHour: Number((booking.space as Record<string, unknown>).price_per_hour ?? 0),
          hours: baseBooking.hours,
          petCount,
          additionalPetRate:
            typeof (booking.space as Record<string, unknown>).additional_pet_rate === "number"
              ? Number((booking.space as Record<string, unknown>).additional_pet_rate)
              : DEFAULT_ADDITIONAL_PET_RATE,
        })
      : undefined;
  return {
    ...baseBooking,
    caregiverId: typeof booking.caregiver_id === "string" ? booking.caregiver_id : undefined,
    updatedAt: typeof booking.updated_at === "string" && booking.updated_at ? toDate(booking.updated_at) : undefined,
    pricing,
    space: mapBookingSpaceSummary(booking.space),
    pets: Array.isArray(booking.pets)
      ? booking.pets
          .map(mapBookingPetSummary)
          .filter((pet): pet is BookingPetSummary => Boolean(pet))
      : undefined,
    owner: mapBookingPartySummary(booking.owner),
    caregiver: mapBookingPartySummary(booking.caregiver),
    canReview: Boolean(booking.can_review ?? false),
    reviewSubmitted: Boolean(booking.review_submitted ?? false),
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
    reviewerName:
      typeof review.reviewer_name === "string" && review.reviewer_name.trim()
        ? review.reviewer_name
        : "Usuario Donver",
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
          name: otherId === currentUserId ? currentUserStore.name : "Usuario Donver",
          avatar: "",
        }
      : undefined,
    spaceTitle: spacesStore.find((space) => space.id === String(conversation.space_id ?? ""))?.title,
  };
}

function buildMockBookingDetail(booking: Booking): BookingDetail {
  const space = spacesStore.find((item) => item.id === booking.spaceId);
  const pets = petsStore
    .filter((pet) => booking.petIds.includes(pet.id))
    .map((pet) => ({
      id: pet.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      size: pet.size,
      age: pet.age,
      description: pet.description,
      photos: [...pet.photos],
      specialNeeds: pet.specialNeeds,
    }));

  const owner: BookingPartySummary = {
    id: booking.ownerId,
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    avatarUrl: booking.ownerId === currentUserStore.id ? currentUserStore.avatar : mockUser.avatar,
  };

  const caregiver: BookingPartySummary | undefined = space
    ? {
        id: space.caregiverId,
        name:
          space.caregiverId === mockCaregiverProfile.id
            ? mockCaregiverProfile.name
            : space.caregiverId === currentUserStore.id
              ? currentUserStore.name
              : "Usuario Donver",
        email: space.caregiverId === mockCaregiverProfile.id ? mockCaregiverProfile.email : undefined,
        phone: space.caregiverId === mockCaregiverProfile.id ? mockCaregiverProfile.phone : undefined,
        avatarUrl:
          space.caregiverId === mockCaregiverProfile.id
            ? mockCaregiverProfile.avatar
            : space.caregiverId === currentUserStore.id
              ? currentUserStore.avatar
              : undefined,
      }
    : undefined;
  const pricing = space
    ? calculateBookingPricing({
        bookingType: booking.bookingType,
        startDate: booking.startDate,
        endDate: booking.endDate,
        pricePerNight: space.pricePerNight,
        pricePerHour: space.pricePerHour,
        hours: booking.hours,
        petCount: booking.petIds.length,
        additionalPetRate: DEFAULT_ADDITIONAL_PET_RATE,
      })
    : undefined;

  return {
    ...cloneBooking(booking),
    caregiverId: space?.caregiverId,
    pricing,
    space: space
      ? {
          id: space.id,
          title: space.title,
          province: space.province,
          canton: space.canton,
          address: space.address,
        }
      : undefined,
    pets,
    owner,
    caregiver,
    canReview:
      booking.ownerId === currentUserStore.id &&
      booking.status === "confirmed" &&
      hasMockBookingEnded(booking) &&
      !reviewsStore.some((review) => review.bookingId === booking.id),
    reviewSubmitted: reviewsStore.some((review) => review.bookingId === booking.id),
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
  const activeRole = deriveActiveRole(user.roles, user.activeRole, user.signupIntent);

  const session: AuthSession = {
    user,
    accessToken: idToken,
    refreshToken,
    idToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    activeRole,
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
  async restoreSession() {
    return restoreAuthSession();
  },

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
      persistAuthSession({
        ...session,
        user,
        activeRole: deriveActiveRole(
          user.roles,
          user.activeRole ?? session.activeRole,
          user.signupIntent ?? session.user.signupIntent
        ),
      });
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
        activeRole: deriveActiveRole(
          currentUserStore.roles,
          currentUserStore.activeRole,
          currentUserStore.signupIntent
        ),
      };
      const session: AuthSession = {
        user: cloneUser(currentUserStore),
        accessToken: `placeholder-access-token-${Date.now()}`,
        refreshToken: `placeholder-refresh-token-${Date.now()}`,
        activeRole: deriveActiveRole(
          currentUserStore.roles,
          currentUserStore.activeRole,
          currentUserStore.signupIntent
        ),
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
    if (!input.name || !input.email || !input.password || !input.province || !input.canton) {
      throw new Error("Nombre, email, contrasena, provincia y canton son obligatorios.");
    }

    if (!IS_API_CONFIGURED) {
      await delay();
      const roles: UserRole[] = input.signupIntent === "caregiver" ? [] : ["owner"];
      currentUserStore = {
        ...cloneUser(currentUserStore),
        name: input.name,
        email: input.email,
        phone: input.phone,
        province: input.province,
        canton: input.canton,
        roles,
        activeRole: deriveActiveRole(
          roles,
          input.signupIntent === "caregiver" ? "caregiver" : "owner",
          input.signupIntent ?? null
        ),
        signupIntent: input.signupIntent ?? null,
      };
      return { user: cloneUser(currentUserStore), confirmed: true };
    }

    const data = await apiRequest<{ confirmed?: boolean; user?: Record<string, unknown> }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          password: input.password,
          phone: input.phone,
          province: toBackendProvince(input.province),
          canton: input.canton,
          signup_intent: input.signupIntent ?? null,
        }),
      },
      { auth: false }
    );

    return {
      confirmed: Boolean(data.confirmed),
      user: data.user ? mapBackendUser(data.user) : undefined,
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
    province?: Province;
    canton?: string;
    activeRole?: UserRole;
  }) {
    if (!IS_API_CONFIGURED) {
      await delay();
      currentUserStore = {
        ...cloneUser(currentUserStore),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.avatarUrl !== undefined ? { avatar: input.avatarUrl } : {}),
        ...(input.province !== undefined ? { province: input.province } : {}),
        ...(input.canton !== undefined ? { canton: input.canton } : {}),
        ...(input.activeRole !== undefined ? { activeRole: input.activeRole } : {}),
      };
      currentUserStore.activeRole = deriveActiveRole(
        currentUserStore.roles,
        currentUserStore.activeRole,
        currentUserStore.signupIntent
      );
      const session = getAuthSession();
      if (session) {
        persistAuthSession({
          ...session,
          user: currentUserStore,
          activeRole: deriveActiveRole(
            currentUserStore.roles,
            currentUserStore.activeRole,
            currentUserStore.signupIntent
          ),
        });
      }
      return cloneUser(currentUserStore);
    }

    const data = await apiRequest<Record<string, unknown>>("/me/profile", {
      method: "PUT",
      body: JSON.stringify({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
        ...(input.province !== undefined ? { province: toBackendProvince(input.province) } : {}),
        ...(input.canton !== undefined ? { canton: input.canton } : {}),
        ...(input.activeRole !== undefined ? { active_role: input.activeRole } : {}),
      }),
    });

    const user = mapBackendUser(data);
    currentUserStore = cloneUser(user);
    const session = getAuthSession();
    if (session) {
      persistAuthSession({
        ...session,
        user,
        activeRole: deriveActiveRole(
          user.roles,
          user.activeRole ?? session.activeRole,
          user.signupIntent ?? session.user.signupIntent
        ),
      });
    }
    return user;
  },

  async activateOwnerProfile(input?: {
    name?: string;
    phone?: string;
    province?: Province;
    canton?: string;
  }) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const nextUser: User = {
        ...cloneUser(currentUserStore),
        ...(input?.name !== undefined ? { name: input.name } : {}),
        ...(input?.phone !== undefined ? { phone: input.phone } : {}),
        ...(input?.province !== undefined ? { province: input.province } : {}),
        ...(input?.canton !== undefined ? { canton: input.canton } : {}),
      };
      const needsOwnerActivation =
        nextUser.roles.includes("caregiver") && !nextUser.roles.includes("owner");

      if (
        needsOwnerActivation &&
        (!nextUser.name.trim() ||
          !nextUser.phone?.trim() ||
          !nextUser.province ||
          !nextUser.canton.trim())
      ) {
        throw new Error("Completa tu nombre, teléfono, provincia y cantón para activar tu perfil de dueño.");
      }

      currentUserStore = {
        ...nextUser,
        roles: needsOwnerActivation ? ["owner", "caregiver"] : nextUser.roles,
        activeRole: deriveActiveRole(
          needsOwnerActivation ? ["owner", "caregiver"] : nextUser.roles,
          needsOwnerActivation ? "owner" : nextUser.activeRole
        ),
        signupIntent: null,
      };

      const session = getAuthSession();
      if (session) {
        persistAuthSession({
          ...session,
          user: currentUserStore,
          activeRole: deriveActiveRole(
            currentUserStore.roles,
            currentUserStore.activeRole,
            currentUserStore.signupIntent
          ),
        });
      }

      return cloneUser(currentUserStore);
    }

    const data = await apiRequest<Record<string, unknown>>("/profile/activate-owner", {
      method: "POST",
      body: JSON.stringify({
        ...(input?.name !== undefined ? { name: input.name } : {}),
        ...(input?.phone !== undefined ? { phone: input.phone } : {}),
        ...(input?.province !== undefined ? { province: toBackendProvince(input.province) } : {}),
        ...(input?.canton !== undefined ? { canton: input.canton } : {}),
      }),
    });

    const user = mapBackendUser(data);
    currentUserStore = cloneUser(user);
    const session = getAuthSession();
    if (session) {
      persistAuthSession({
        ...session,
        user,
        activeRole: deriveActiveRole(
          user.roles,
          user.activeRole ?? session.activeRole,
          user.signupIntent ?? session.user.signupIntent
        ),
      });
    }
    return user;
  },

  async completeCaregiverOnboarding(input: {
    name: string;
    phone: string;
    province: Province;
    canton: string;
    bio: string;
  }) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const nextRoles: UserRole[] =
        currentUserStore.signupIntent === "caregiver"
          ? ["caregiver"]
          : Array.from(new Set([...currentUserStore.roles, "owner", "caregiver"]));
      currentUserStore = {
        ...cloneUser(currentUserStore),
        name: input.name,
        phone: input.phone,
        province: input.province,
        canton: input.canton,
        bio: input.bio,
        roles: nextRoles,
        activeRole: "caregiver",
        signupIntent: null,
      };
      const session = getAuthSession();
      if (session) {
        persistAuthSession({
          ...session,
          user: currentUserStore,
          activeRole: deriveActiveRole(currentUserStore.roles, currentUserStore.activeRole, currentUserStore.signupIntent),
        });
      }
      return cloneUser(currentUserStore);
    }

    const data = await apiRequest<Record<string, unknown>>("/caregiver/onboarding", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        province: toBackendProvince(input.province),
        canton: input.canton,
        bio: input.bio,
      }),
    });

    const user = mapBackendUser(data);
    currentUserStore = cloneUser(user);
    const session = getAuthSession();
    if (session) {
      persistAuthSession({
        ...session,
        user,
        activeRole: deriveActiveRole(
          user.roles,
          user.activeRole ?? session.activeRole,
          user.signupIntent ?? session.user.signupIntent
        ),
      });
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
      `/spaces${params.size ? `?${params.toString()}` : ""}`,
      undefined,
      { auth: false }
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

    const data = await apiRequest<{ space: Record<string, unknown> }>(
      `/spaces/${spaceId}`,
      undefined,
      { auth: false }
    );
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
        isActive: input.isActive ?? false,
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
        district: input.district,
        address: input.address,
        formatted_address: input.formattedAddress,
        latitude: input.latitude,
        longitude: input.longitude,
        accepted_pet_types: input.acceptedPetTypes,
        accepted_pet_sizes: input.acceptedPetSizes,
        price_per_night: input.pricePerNight,
        price_per_hour: input.pricePerHour,
        min_hours: input.minHours,
        max_pets: input.maxPets,
        amenities: input.amenities,
        photos: input.photos,
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
    if (patch.district !== undefined) body.district = patch.district;
    if (patch.address !== undefined) body.address = patch.address;
    if (patch.formattedAddress !== undefined) body.formatted_address = patch.formattedAddress;
    if (patch.latitude !== undefined) body.latitude = patch.latitude;
    if (patch.longitude !== undefined) body.longitude = patch.longitude;
    if (patch.acceptedPetTypes !== undefined) body.accepted_pet_types = patch.acceptedPetTypes;
    if (patch.acceptedPetSizes !== undefined) body.accepted_pet_sizes = patch.acceptedPetSizes;
    if (patch.pricePerNight !== undefined) body.price_per_night = patch.pricePerNight;
    if (patch.pricePerHour !== undefined) body.price_per_hour = patch.pricePerHour;
    if (patch.minHours !== undefined) body.min_hours = patch.minHours;
    if (patch.maxPets !== undefined) body.max_pets = patch.maxPets;
    if (patch.amenities !== undefined) body.amenities = patch.amenities;
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

  async listCaregiver() {
    if (!IS_API_CONFIGURED) {
      await delay();
      const caregiverSpaceIds = new Set(
        spacesStore
          .filter((space) => space.caregiverId === currentUserStore.id)
          .map((space) => space.id)
      );
      return bookingsStore
        .filter((booking) => caregiverSpaceIds.has(booking.spaceId))
        .map(cloneBooking);
    }

    const data = await apiRequest<Record<string, unknown>[]>("/caregiver/bookings");
    return Array.isArray(data) ? data.map(mapBackendBooking) : [];
  },

  async getById(bookingId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const booking = requireEntity(
        bookingsStore.find((item) => item.id === bookingId),
        "Reservacion no encontrada."
      );
      return cloneBookingDetail(buildMockBookingDetail(booking));
    }

    const data = await apiRequest<Record<string, unknown>>(`/bookings/${bookingId}`);
    return mapBackendBookingDetail(data);
  },

  async create(input: CreateBookingInput) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const space = requireEntity(
        spacesStore.find((item) => item.id === input.spaceId),
        "Espacio no encontrado."
      );
      if (input.petIds.length > space.maxPets) {
        throw new Error(`Este espacio permite máximo ${space.maxPets} mascotas por reserva.`);
      }
      const pricing = calculateBookingPricing({
        bookingType: input.bookingType,
        startDate: input.startDate,
        endDate: input.endDate,
        pricePerNight: space.pricePerNight,
        pricePerHour: space.pricePerHour,
        hours: input.hours,
        petCount: input.petIds.length,
        additionalPetRate: DEFAULT_ADDITIONAL_PET_RATE,
      });
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
        subtotal: pricing.subtotal,
        serviceFee: pricing.serviceFee,
        totalPrice: pricing.total,
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
      if (status === "confirmed" && booking.status !== "pending") {
        throw new Error("Solo se pueden confirmar reservaciones pendientes.");
      }
      if (status === "cancelled" && booking.status !== "pending" && booking.status !== "confirmed") {
        throw new Error("Solo se pueden cancelar reservaciones pendientes o confirmadas.");
      }
      const updated: Booking = { ...booking, status };
      bookingsStore = bookingsStore.map((item) => (item.id === bookingId ? updated : item));
      return cloneBooking(updated);
    }

    if (status === "confirmed") {
      const data = await apiRequest<Record<string, unknown>>(`/bookings/${bookingId}/confirm`, {
        method: "POST",
      });
      return mapBackendBooking(data);
    }

    if (status === "cancelled") {
      const data = await apiRequest<Record<string, unknown>>(`/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      return mapBackendBooking(data);
    }

    throw new Error("Ese cambio de estado no está soportado en esta fase.");
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
        size: input.size,
        description: input.description,
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
        ...(patch.size !== undefined ? { size: patch.size } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
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

    const data = await apiRequest<Record<string, unknown>[]>(
      `/spaces/${spaceId}/reviews`,
      undefined,
      { auth: false }
    );
    return Array.isArray(data)
      ? data.map(mapBackendReview).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      : [];
  },

  async create(input: Pick<Review, "bookingId" | "spaceId" | "rating" | "comment">) {
    if (!IS_API_CONFIGURED) {
      await delay();
      const review: Review = {
        ...input,
        id: createId("review"),
        reviewerName: currentUserStore.name || "Usuario Donver",
        createdAt: new Date(),
      };
      reviewsStore = [review, ...reviewsStore];
      recalculateMockSpaceReviews(input.spaceId);
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

export const favoritesApi = {
  async list() {
    if (!IS_API_CONFIGURED) {
      await delay();
      return favoriteSpaceIdsStore
        .map((spaceId) => spacesStore.find((space) => space.id === spaceId))
        .filter((space): space is Space => Boolean(space))
        .map(cloneSpace);
    }

    const data = await apiRequest<Record<string, unknown>[]>("/favorites");
    return Array.isArray(data) ? data.map(mapBackendSpace) : [];
  },

  async add(spaceId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      if (!favoriteSpaceIdsStore.includes(spaceId)) {
        favoriteSpaceIdsStore = [spaceId, ...favoriteSpaceIdsStore];
      }

      const space = requireEntity(
        spacesStore.find((item) => item.id === spaceId),
        "Espacio no encontrado."
      );
      return cloneSpace(space);
    }

    const data = await apiRequest<Record<string, unknown>>(`/favorites/${spaceId}`, {
      method: "POST",
    });
    return mapBackendSpace(data);
  },

  async remove(spaceId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      favoriteSpaceIdsStore = favoriteSpaceIdsStore.filter((id) => id !== spaceId);
      return { success: true };
    }

    await apiRequest(`/favorites/${spaceId}`, {
      method: "DELETE",
    });
    return { success: true };
  },
};

export const availabilityApi = {
  async list(spaceId: string) {
    if (!IS_API_CONFIGURED) {
      await delay();
      return blockedDatesStore.filter((blockedDate) => blockedDate.spaceId === spaceId).map(cloneBlockedDate);
    }

    const data = await apiRequest<{ blockedDates?: Record<string, unknown>[] }>(
      `/spaces/${spaceId}`,
      undefined,
      { auth: false }
    );
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
