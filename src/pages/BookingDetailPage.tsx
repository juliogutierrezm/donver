import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, Clock3, DollarSign, Home, Mail, MessageSquare, PawPrint, Phone, ShieldAlert, UserRound } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getPetSizeLabel, getPetTypeSingularLabel } from "@/lib/pet-labels";
import { ApiError, authApi, bookingsApi, messagesApi, type BookingDetail, type BookingPartySummary } from "@/services/api";
import type { User } from "@/types";

type ViewState = "loading" | "ready" | "forbidden" | "not-found" | "error";
type ContactState = "idle" | "loading" | "available" | "unavailable";

const statusLabels: Record<BookingDetail["status"], string> = {
  pending: "Pendiente de aprobación",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

const statusClasses: Record<BookingDetail["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

function formatCurrency(amount: number) {
  return `₡${amount.toLocaleString("es-CR")}`;
}

function formatBookingType(detail: BookingDetail) {
  return detail.bookingType === "overnight" ? "Por noche" : "Por hora";
}

function formatDateTimeLabel(value: Date) {
  return format(value, "d 'de' MMMM yyyy", { locale: es });
}

function formatAgeLabel(age?: number) {
  if (typeof age !== "number" || Number.isNaN(age)) return null;
  return `${age} ${age === 1 ? "año" : "años"}`;
}

function ContactInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/40 p-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DetailState({
  title,
  description,
  variant = "default",
}: {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <ShieldAlert className={`mx-auto mb-4 h-10 w-10 ${variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`} />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline">
          <Link to="/profile">Volver al perfil</Link>
        </Button>
      </div>
    </div>
  );
}

type PendingAction = "confirm" | "cancel" | null;

function PartyCard({ title, party }: { title: string; party?: BookingPartySummary }) {
  if (!party) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="mt-4 flex items-center gap-3">
        {party.avatarUrl ? (
          <img
            src={party.avatarUrl}
            alt={party.name || "Usuario Donver"}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserRound className="h-6 w-6" />
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{party.name || "Usuario Donver"}</p>
          <p className="text-sm text-muted-foreground">
            {party.email || "Correo no disponible"}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <ContactInfoRow
          icon={<Mail className="h-4 w-4" />}
          label="Correo"
          value={party.email || "Correo no disponible"}
        />
        <ContactInfoRow
          icon={<Phone className="h-4 w-4" />}
          label="Teléfono"
          value={party.phone || "Teléfono no disponible"}
        />
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [contactState, setContactState] = useState<ContactState>("idle");
  const [contactConversationId, setContactConversationId] = useState<string | null>(null);

  const reloadDetail = async (bookingId: string) => {
    const bookingDetail = await bookingsApi.getById(bookingId);
    setDetail(bookingDetail);
    setViewState("ready");
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setViewState("not-found");
        return;
      }

      try {
        const user = await authApi.getCurrentUser();
        if (cancelled) return;
        setCurrentUser(user);

        const bookingDetail = await bookingsApi.getById(id);
        if (cancelled) return;

        setDetail(bookingDetail);
        setViewState("ready");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message.toLowerCase().includes("sesion")) {
          navigate(`/login?next=${encodeURIComponent(`/bookings/${id}`)}`, { replace: true });
          return;
        }

        if (error instanceof ApiError) {
          if (error.status === 403) {
            setViewState("forbidden");
            return;
          }
          if (error.status === 404) {
            setViewState("not-found");
            return;
          }
        }

        setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar la reserva.");
        setViewState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const counterparty = useMemo(() => {
    if (!detail || !currentUser) return undefined;
    const isOwnerView = currentUser.id === detail.ownerId;
    return {
      title: isOwnerView ? "Datos del cuidador" : "Datos del dueño de la reserva",
      party: isOwnerView ? detail.caregiver : detail.owner,
    };
  }, [currentUser, detail]);

  useEffect(() => {
    let cancelled = false;

    async function resolveConversation() {
      if (
        viewState !== "ready" ||
        !detail ||
        !counterparty?.party?.id ||
        !detail.spaceId
      ) {
        setContactState("unavailable");
        setContactConversationId(null);
        return;
      }

      setContactState("loading");
      try {
        const conversations = await messagesApi.listConversations();
        if (cancelled) return;

        const match = conversations.find(
          (conversation) =>
            conversation.spaceId === detail.spaceId &&
            conversation.otherParticipant?.id === counterparty.party?.id
        );

        if (match) {
          setContactConversationId(match.id);
          setContactState("available");
          return;
        }

        setContactConversationId(null);
        setContactState("unavailable");
      } catch {
        if (cancelled) return;
        setContactConversationId(null);
        setContactState("unavailable");
      }
    }

    void resolveConversation();
    return () => {
      cancelled = true;
    };
  }, [counterparty?.party?.id, detail, viewState]);

  const isCaregiver = Boolean(detail && currentUser && detail.caregiverId === currentUser.id);
  const isOwner = Boolean(detail && currentUser && detail.ownerId === currentUser.id);
  const canConfirm = Boolean(detail && isCaregiver && detail.status === "pending");
  const canReject = Boolean(detail && isCaregiver && detail.status === "pending");
  const canCancel = Boolean(
    detail &&
      detail.status !== "cancelled" &&
      ((isOwner && (detail.status === "pending" || detail.status === "confirmed")) ||
        (isCaregiver && detail.status === "confirmed"))
  );

  const handleAction = async () => {
    if (!detail || !pendingAction) return;

    try {
      setActionLoading(true);
      await bookingsApi.updateStatus(detail.id, pendingAction === "confirm" ? "confirmed" : "cancelled");
      await reloadDetail(detail.id);
      toast({
        title: pendingAction === "confirm" ? "Reserva confirmada" : "Reserva actualizada",
        description:
          pendingAction === "confirm"
            ? "La reserva fue aceptada correctamente."
            : "El estado de la reserva se actualizó correctamente.",
      });
    } catch (error) {
      toast({
        title: "No se pudo actualizar la reserva",
        description: error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const actionCopy =
    pendingAction === "confirm"
      ? {
          title: "Aceptar reserva",
          description: "Esta acción cambiará la reserva de pendiente a confirmada.",
          button: "Aceptar reserva",
        }
      : {
          title: "Cancelar o rechazar reserva",
          description:
            isCaregiver && detail?.status === "pending"
              ? "Esta acción rechazará la reserva pendiente y la dejará cancelada."
              : "Esta acción cancelará la reserva actual.",
          button: "Confirmar acción",
        };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          {viewState === "loading" && (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
              Cargando detalle de la reserva...
            </div>
          )}

          {viewState === "forbidden" && (
            <DetailState
              title="Sin permisos para ver esta reserva"
              description="Esta reserva no pertenece a tu cuenta ni a uno de tus espacios."
              variant="destructive"
            />
          )}

          {viewState === "not-found" && (
            <DetailState
              title="Reserva no encontrada"
              description="La reserva que intentaste abrir no existe o ya no está disponible."
            />
          )}

          {viewState === "error" && (
            <DetailState
              title="No se pudo cargar la reserva"
              description={errorMessage || "Intenta nuevamente en unos minutos."}
              variant="destructive"
            />
          )}

          {viewState === "ready" && detail && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resumen de tu reservación</p>
                    <h1 className="mt-1 text-3xl font-heading font-bold text-foreground">
                      Detalle de reservación
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Creada el {format(detail.createdAt, "d MMM yyyy, h:mm a", { locale: es })}
                    </p>
                  </div>
                  <Badge className={statusClasses[detail.status]}>{statusLabels[detail.status]}</Badge>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Resumen de la reserva</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-secondary/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
                        <p className="mt-2 font-semibold text-foreground">{statusLabels[detail.status]}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</p>
                        <p className="mt-2 font-semibold text-foreground">{formatBookingType(detail)}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Fecha inicio
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatDateTimeLabel(detail.startDate)}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Fecha fin
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatDateTimeLabel(detail.endDate)}</p>
                      </div>
                      {detail.bookingType === "hourly" && (
                        <>
                          <div className="rounded-lg bg-secondary/40 p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                              <Clock3 className="h-3.5 w-3.5" />
                              Hora inicio
                            </div>
                            <p className="mt-2 font-semibold text-foreground">{detail.startTime || "No definida"}</p>
                          </div>
                          <div className="rounded-lg bg-secondary/40 p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                              <Clock3 className="h-3.5 w-3.5" />
                              Hora fin
                            </div>
                            <p className="mt-2 font-semibold text-foreground">{detail.endTime || "No definida"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Espacio reservado</h2>
                    {detail.space ? (
                      <div className="mt-4 rounded-lg border border-border p-4">
                        <div className="flex items-start gap-3">
                          <Home className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{detail.space.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {[detail.space.canton, detail.space.province].filter(Boolean).join(", ") || "Ubicación no disponible"}
                            </p>
                            {detail.space.address && (
                              <p className="mt-1 text-sm text-muted-foreground">{detail.space.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">No hay información adicional del espacio disponible.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Mascotas asociadas</h2>
                    {detail.pets && detail.pets.length > 0 ? (
                      <div className="mt-4 grid gap-4">
                        {detail.pets.map((pet) => (
                          <div key={pet.id} className="overflow-hidden rounded-xl border border-border">
                            <div className="grid gap-0 md:grid-cols-[220px,1fr]">
                              <div className="bg-muted/40">
                                {pet.photos && pet.photos.length > 0 ? (
                                  <div className="space-y-2 p-3">
                                    <img
                                      src={pet.photos[0]}
                                      alt={pet.name}
                                      className="h-48 w-full rounded-lg object-cover"
                                    />
                                    {pet.photos.length > 1 && (
                                      <div className="grid grid-cols-3 gap-2">
                                        {pet.photos.slice(1, 4).map((photo, index) => (
                                          <img
                                            key={`${pet.id}-photo-${index}`}
                                            src={photo}
                                            alt={`${pet.name} ${index + 2}`}
                                            className="h-16 w-full rounded-md object-cover"
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-4 py-6 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                      <PawPrint className="h-7 w-7" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">Sin foto registrada</p>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        Esta mascota no tiene imágenes cargadas.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4 p-5">
                                <div>
                                  <p className="text-lg font-semibold text-foreground">{pet.name}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {getPetTypeSingularLabel(pet.type)}
                                    {pet.breed ? ` • ${pet.breed}` : ""}
                                    {pet.size ? ` • ${getPetSizeLabel(pet.size)}` : ""}
                                    {formatAgeLabel(pet.age) ? ` • ${formatAgeLabel(pet.age)}` : ""}
                                  </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-lg bg-secondary/40 p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Tamaño</p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                      {pet.size ? getPetSizeLabel(pet.size) : "No registrado"}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-secondary/40 p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Edad</p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                      {formatAgeLabel(pet.age) || "No registrada"}
                                    </p>
                                  </div>
                                </div>

                                {pet.description && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Descripción</p>
                                    <p className="mt-1 text-sm leading-6 text-foreground">{pet.description}</p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Necesidades especiales
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-foreground">
                                    {pet.specialNeeds || "Sin necesidades especiales registradas"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">No hay mascotas asociadas disponibles en este detalle.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Notas</h2>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {detail.notes?.trim() ? detail.notes : "Esta reserva no incluye notas adicionales."}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Cobro</h2>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Precio base</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(detail.pricing?.baseSubtotal ?? detail.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Mascotas adicionales ({Math.max(detail.petIds.length - 1, 0)})
                        </span>
                        <span className="font-semibold text-foreground">
                          {Math.max(detail.petIds.length - 1, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Recargo mascotas adicionales ({Math.round((detail.pricing?.additionalPetRate ?? 0.4) * 100)}%)
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(detail.pricing?.additionalPetFee ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-foreground">{formatCurrency(detail.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Comisión Donver</span>
                        <span className="font-semibold text-foreground">{formatCurrency(detail.serviceFee)}</span>
                      </div>
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-foreground">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Total
                          </span>
                          <span className="text-xl font-bold text-primary">{formatCurrency(detail.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {counterparty && (
                    <PartyCard
                      title={counterparty.title}
                      party={counterparty.party}
                    />
                  )}

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Contacto</h2>
                    {counterparty?.party ? (
                      <div className="mt-3 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Usa estos datos para coordinar tu reserva con{" "}
                          {counterparty.party.name || "la otra persona de la reserva"}.
                        </p>
                        {detail.space?.title && isOwner && (
                          <div className="rounded-lg bg-secondary/40 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Espacio reservado</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{detail.space.title}</p>
                          </div>
                        )}
                        {contactState === "available" && contactConversationId ? (
                          <Button
                            className="w-full gap-2"
                            onClick={() =>
                              navigate("/messages", {
                                state: { initialConversationId: contactConversationId },
                              })
                            }
                          >
                            <MessageSquare className="h-4 w-4" />
                            Enviar mensaje
                          </Button>
                        ) : contactState === "loading" ? (
                          <p className="text-sm text-muted-foreground">Buscando conversación disponible...</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            La mensajería estará disponible próximamente.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        La mensajería estará disponible próximamente.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Acciones</h2>
                    {canConfirm || canReject || canCancel ? (
                      <div className="mt-3 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {canConfirm
                            ? "Como cuidador puedes aceptar o rechazar esta reserva pendiente."
                            : "Puedes cancelar esta reserva si todavía aplica."}
                        </p>
                        {canConfirm && (
                          <Button className="w-full" onClick={() => setPendingAction("confirm")}>
                            Aceptar reserva
                          </Button>
                        )}
                        {canReject && (
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setPendingAction("cancel")}
                          >
                            Rechazar reserva
                          </Button>
                        )}
                        {!canReject && canCancel && (
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setPendingAction("cancel")}
                          >
                            Cancelar reserva
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No hay acciones disponibles para esta reserva en esta fase.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionCopy.title}</DialogTitle>
            <DialogDescription>{actionCopy.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={actionLoading}>
              Volver
            </Button>
            <Button
              variant={pendingAction === "confirm" ? "default" : "destructive"}
              onClick={() => void handleAction()}
              disabled={actionLoading}
            >
              {actionLoading ? "Procesando..." : actionCopy.button}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </>
  );
}
