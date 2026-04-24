export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt?: Date;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
  otherParticipant?: UserProfile;
  spaceTitle?: string;
}
