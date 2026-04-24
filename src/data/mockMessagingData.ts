import type {
  Message,
  Conversation,
  ConversationParticipant,
  ConversationWithDetails,
  UserProfile,
} from "@/types/messaging";
import { mockSpaces } from "@/data/mockData";

const mockUsers: Record<string, UserProfile> = {
  "user-1": {
    id: "user-1",
    name: "María González",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Maria",
  },
  "caregiver-1": {
    id: "caregiver-1",
    name: "Carlos Rodríguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
  },
  "caregiver-3": {
    id: "caregiver-3",
    name: "Laura Jiménez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
  },
  "caregiver-5": {
    id: "caregiver-5",
    name: "Andrés Vargas",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andres",
  },
};

export function getUserById(userId: string): UserProfile | undefined {
  return mockUsers[userId];
}

export const mockParticipants: ConversationParticipant[] = [
  {
    id: "participant-1",
    conversationId: "conversation-1",
    userId: "user-1",
    createdAt: new Date("2024-04-01"),
  },
  {
    id: "participant-2",
    conversationId: "conversation-1",
    userId: "caregiver-1",
    createdAt: new Date("2024-04-01"),
  },
  {
    id: "participant-3",
    conversationId: "conversation-2",
    userId: "user-1",
    createdAt: new Date("2024-04-10"),
  },
  {
    id: "participant-4",
    conversationId: "conversation-2",
    userId: "caregiver-3",
    createdAt: new Date("2024-04-10"),
  },
  {
    id: "participant-5",
    conversationId: "conversation-3",
    userId: "user-1",
    createdAt: new Date("2024-04-15"),
  },
  {
    id: "participant-6",
    conversationId: "conversation-3",
    userId: "caregiver-5",
    createdAt: new Date("2024-04-15"),
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "conversation-1",
    spaceId: "space-1",
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-20"),
  },
  {
    id: "conversation-2",
    spaceId: "space-3",
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-22"),
  },
  {
    id: "conversation-3",
    spaceId: "space-5",
    createdAt: new Date("2024-04-15"),
    updatedAt: new Date("2024-04-21"),
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conversation-1",
    senderId: "user-1",
    body: "Hola, ¿está disponible tu casa para el 25-27 de abril?",
    createdAt: new Date("2024-04-15 10:30"),
    readAt: new Date("2024-04-15 10:45"),
  },
  {
    id: "msg-2",
    conversationId: "conversation-1",
    senderId: "caregiver-1",
    body: "¡Hola María! Sí, esas fechas están disponibles. Luna será bien recibida 🐾",
    createdAt: new Date("2024-04-15 11:00"),
    readAt: new Date("2024-04-15 11:15"),
  },
  {
    id: "msg-3",
    conversationId: "conversation-1",
    senderId: "user-1",
    body: "Perfecto, Luna es muy activa. ¿Cuál es tu política de paseos?",
    createdAt: new Date("2024-04-15 11:30"),
    readAt: new Date("2024-04-15 11:45"),
  },
  {
    id: "msg-4",
    conversationId: "conversation-1",
    senderId: "caregiver-1",
    body:
      "Ofrezco paseos diarios de 1 hora cada uno. Luna podrá jugar en el jardín también.",
    createdAt: new Date("2024-04-15 12:00"),
    readAt: new Date("2024-04-15 12:15"),
  },
  {
    id: "msg-5",
    conversationId: "conversation-1",
    senderId: "user-1",
    body: "¡Excelente! Voy a confirmar la reservación ahora.",
    createdAt: new Date("2024-04-20 14:30"),
    readAt: new Date("2024-04-20 14:45"),
  },
  {
    id: "msg-6",
    conversationId: "conversation-2",
    senderId: "user-1",
    body: "Hola, me interesa tu finca para el 1 de mayo.",
    createdAt: new Date("2024-04-18 09:00"),
    readAt: new Date("2024-04-18 09:30"),
  },
  {
    id: "msg-7",
    conversationId: "conversation-2",
    senderId: "caregiver-3",
    body: "¡Hola! Esa fecha está disponible. ¿Cuántas mascotas tienes?",
    createdAt: new Date("2024-04-18 10:00"),
    readAt: new Date("2024-04-18 10:15"),
  },
  {
    id: "msg-8",
    conversationId: "conversation-2",
    senderId: "user-1",
    body: "Tengo dos: un gato y un perro pequeño. ¿Aceptas ambos?",
    createdAt: new Date("2024-04-18 10:45"),
    readAt: new Date("2024-04-18 11:00"),
  },
  {
    id: "msg-9",
    conversationId: "conversation-3",
    senderId: "user-1",
    body: "Hola, ¿está tu apartamento disponible para este fin de semana?",
    createdAt: new Date("2024-04-19 15:30"),
  },
];

export function getConversationsWithDetails(): ConversationWithDetails[] {
  return mockConversations.map((conversation) => {
    const participants = mockParticipants.filter(
      (p) => p.conversationId === conversation.id
    );
    const messages = mockMessages.filter(
      (m) => m.conversationId === conversation.id
    );
    const lastMessage = messages.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
    const unreadCount = messages.filter(
      (m) => m.senderId !== "user-1" && !m.readAt
    ).length;

    const otherParticipantId = participants.find(
      (p) => p.userId !== "user-1"
    )?.userId;
    const otherParticipant = otherParticipantId
      ? getUserById(otherParticipantId)
      : undefined;

    const space = mockSpaces.find((s) => s.id === conversation.spaceId);

    return {
      ...conversation,
      participants,
      lastMessage,
      unreadCount,
      otherParticipant,
      spaceTitle: space?.title,
    };
  });
}

export function getMessagesForConversation(
  conversationId: string
): Message[] {
  return mockMessages.filter((m) => m.conversationId === conversationId);
}

export function getCurrentUserId(): string {
  return "user-1";
}
