import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/messaging";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderAvatar?: string;
  senderName?: string;
}

export function MessageBubble({
  message,
  isOwn,
  senderAvatar,
  senderName,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
      {/* Avatar — only for the other participant */}
      {!isOwn && (
        <img
          src={
            senderAvatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
          }
          alt={senderName}
          className="w-7 h-7 rounded-full object-cover shrink-0 self-end"
        />
      )}

      {/* Bubble + meta */}
      <div className={cn("max-w-[72%] space-y-1", isOwn && "items-end flex flex-col")}>
        {!isOwn && senderName && (
          <p className="text-xs font-semibold text-muted-foreground px-1">{senderName}</p>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-secondary text-foreground rounded-bl-sm"
          )}
        >
          {message.body}
        </div>

        {/* Timestamp + read status */}
        <div className={cn("flex items-center gap-1 px-1", isOwn && "flex-row-reverse")}>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), "HH:mm", { locale: es })}
          </span>
          {isOwn && (
            <span
              className={cn(
                "flex",
                message.readAt ? "text-primary" : "text-muted-foreground"
              )}
            >
              {message.readAt ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
