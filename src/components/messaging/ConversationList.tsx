import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationWithDetails } from "@/types/messaging";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mb-3 opacity-40" />
        <p className="font-semibold text-foreground">Sin conversaciones</p>
        <p className="text-sm text-muted-foreground mt-1">
          Cuando contactes a un cuidador, tus mensajes aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const hasUnread = (conv.unreadCount ?? 0) > 0;

        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-4 hover:bg-secondary/60 transition-colors text-left",
                isSelected && "bg-secondary"
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={
                    conv.otherParticipant?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
                  }
                  alt={conv.otherParticipant?.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-card" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm truncate",
                      hasUnread
                        ? "font-bold text-foreground"
                        : "font-semibold text-foreground"
                    )}
                  >
                    {conv.otherParticipant?.name ?? "Cuidador"}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                        locale: es,
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>

                {/* Space name */}
                {conv.spaceTitle && (
                  <p className="text-xs text-primary truncate">{conv.spaceTitle}</p>
                )}

                {/* Last message */}
                <p
                  className={cn(
                    "text-xs mt-0.5 truncate",
                    hasUnread
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {conv.lastMessage?.body ?? "Sin mensajes"}
                </p>
              </div>

              {/* Unread count badge */}
              {hasUnread && (
                <span className="shrink-0 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-primary rounded-full">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
