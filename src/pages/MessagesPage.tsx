import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { getCurrentUserId, messagesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { ConversationWithDetails, Message } from "@/types/messaging";

export default function MessagesPage() {
  const location = useLocation();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>({});
  const initialConversationId =
    typeof (location.state as { initialConversationId?: unknown } | null)?.initialConversationId === "string"
      ? ((location.state as { initialConversationId?: string }).initialConversationId ?? null)
      : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await messagesApi.listConversations();
        if (cancelled) return;
        setConversations(data);
        if (initialConversationId && data.some((conversation) => conversation.id === initialConversationId)) {
          setSelectedId(initialConversationId);
          return;
        }
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "No se pudieron cargar las conversaciones",
          description:
            error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
          variant: "destructive",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialConversationId, selectedId, toast]);

  useEffect(() => {
    if (!selectedId || messagesByConv[selectedId]) return;
    const conversationId = selectedId;

    let cancelled = false;

    async function loadMessages() {
      try {
        const data = await messagesApi.listMessages(conversationId);
        if (cancelled) return;
        setMessagesByConv((prev) => ({ ...prev, [conversationId]: data }));
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "No se pudieron cargar los mensajes",
          description:
            error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
          variant: "destructive",
        });
      }
    }

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [messagesByConv, selectedId, toast]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);

  async function handleSend(body: string) {
    if (!selectedConversation) {
      throw new Error("No hay una conversacion seleccionada.");
    }

    const sentMessage = await messagesApi.sendMessage(selectedConversation.id, body);
    setMessagesByConv((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), sentMessage],
    }));
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              lastMessage: sentMessage,
              updatedAt: sentMessage.createdAt,
            }
          : conversation
      )
    );
    return sentMessage;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-0 md:px-4 py-0 md:py-8 max-w-5xl">
        <div className="md:rounded-2xl overflow-hidden border border-border bg-card shadow-sm flex h-[calc(100vh-10rem)]">
          <aside
            className={`
              w-full md:w-80 border-r border-border flex flex-col shrink-0
              ${selectedId ? "hidden md:flex" : "flex"}
            `}
          >
            <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">Mensajes</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </aside>

          <div
            className={`
              flex-1 flex flex-col
              ${selectedId ? "flex" : "hidden md:flex"}
            `}
          >
            {selectedConversation ? (
              <ChatWindow
                key={selectedConversation.id}
                conversation={selectedConversation}
                messages={messagesByConv[selectedConversation.id] ?? []}
                currentUserId={getCurrentUserId()}
                onBack={() => setSelectedId(null)}
                onSend={handleSend}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground text-lg">
                  Selecciona una conversación
                </p>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Elige una conversación de la lista para ver tus mensajes.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
