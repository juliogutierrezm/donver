import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./MessageBubble";
import type { Message, ConversationWithDetails } from "@/types/messaging";

interface ChatWindowProps {
  conversation: ConversationWithDetails;
  messages: Message[];
  currentUserId: string;
  onBack?: () => void;
  onSend?: (body: string) => Promise<Message>;
}

export function ChatWindow({
  conversation,
  messages: initialMessages,
  currentUserId,
  onBack,
  onSend,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Re-sync when the selected conversation changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [conversation.id, initialMessages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    if (onSend) {
      setSending(true);
      try {
        const sentMessage = await onSend(trimmed);
        setMessages((prev) => [...prev, sentMessage]);
        setText("");
        inputRef.current?.focus();
      } finally {
        setSending(false);
      }
      return;
    }

    const newMsg: Message = {
      id: `msg-local-${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUserId,
      body: trimmed,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");
    inputRef.current?.focus();
  };

  const { otherParticipant, spaceTitle } = conversation;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <img
          src={
            otherParticipant?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
          }
          alt={otherParticipant?.name}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {otherParticipant?.name ?? "Cuidador"}
          </p>
          {spaceTitle && (
            <p className="text-xs text-primary truncate">{spaceTitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            Aún no hay mensajes. ¡Sé el primero en escribir!
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
            senderAvatar={otherParticipant?.avatar}
            senderName={otherParticipant?.name}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card shrink-0">
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
          disabled={!text.trim() || sending}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
