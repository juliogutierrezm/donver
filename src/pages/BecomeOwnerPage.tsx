import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/routes";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";
import { CANTONES, PROVINCES, type Province, type User } from "@/types";

type ActivationFormData = {
  name: string;
  phone: string;
  province: string;
  canton: string;
};

const fieldLabels: Record<keyof ActivationFormData, string> = {
  name: "Nombre completo",
  phone: "Teléfono",
  province: "Provincia",
  canton: "Cantón",
};

function getActivationFormData(user: User): ActivationFormData {
  const formData: ActivationFormData = {
    name: user.name ?? "",
    phone: user.phone ?? "",
    province: user.province ?? "",
    canton: user.canton ?? "",
  };
  const missingFields = new Set(user.caregiverStatus?.missingProfileFields ?? []);

  for (const field of Object.keys(fieldLabels) as Array<keyof ActivationFormData>) {
    if (missingFields.has(field)) {
      formData[field] = "";
    }
  };

  return formData;
}

function validateActivationForm(formData: ActivationFormData) {
  const errors: Partial<Record<keyof ActivationFormData | "confirmation", string>> = {};

  if (!formData.name.trim()) {
    errors.name = "Ingresa tu nombre completo.";
  }
  if (!formData.phone.trim()) {
    errors.phone = "Ingresa tu teléfono.";
  }
  if (!formData.province.trim()) {
    errors.province = "Selecciona tu provincia.";
  }
  if (!formData.canton.trim()) {
    errors.canton = "Selecciona tu cantón.";
  }

  return errors;
}

export default function BecomeOwnerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<ActivationFormData>({
    name: "",
    phone: "",
    province: "",
    canton: "",
  });
  const [confirmActivation, setConfirmActivation] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = await authApi.restoreSession().catch(() => null);
      if (!session) {
        navigate(`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.becomeOwner)}`, {
          replace: true,
        });
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (cancelled) return;

        const isCaregiverOnly =
          currentUser.roles.includes("caregiver") && !currentUser.roles.includes("owner");

        if (!isCaregiverOnly) {
          navigate(APP_ROUTES.profile, { replace: true });
          return;
        }

        setUser(currentUser);
        setFormData(getActivationFormData(currentUser));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message.toLowerCase().includes("sesion")) {
          navigate(`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.becomeOwner)}`, {
            replace: true,
          });
          return;
        }

        toast({
          title: "No se pudo cargar la activación",
          description:
            error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
          variant: "destructive",
        });
        navigate(APP_ROUTES.profile, { replace: true });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  const availableCantons = useMemo(() => {
    if (!formData.province) return [];
    return CANTONES[formData.province as Province] || [];
  }, [formData.province]);

  useEffect(() => {
    if (formData.province && formData.canton && !availableCantons.includes(formData.canton)) {
      setFormData((current) => ({ ...current, canton: "" }));
    }
  }, [availableCantons, formData.canton, formData.province]);

  const validationErrors = useMemo(() => validateActivationForm(formData), [formData]);
  const isFormValid = Object.keys(validationErrors).length === 0 && confirmActivation;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowValidation(true);

    if (Object.keys(validationErrors).length > 0 || !confirmActivation) {
      return;
    }

    setSubmitting(true);

    try {
      await authApi.activateOwnerProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        province: formData.province as Province,
        canton: formData.canton.trim(),
      });

      toast({
        title: "Tu perfil de dueño está activo",
        description: "Ahora puedes registrar mascotas y reservar espacios.",
      });
      navigate(APP_ROUTES.profile, { replace: true });
    } catch (error) {
      toast({
        title: "No se pudo activar el perfil de dueño",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Cargando activación...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Activar perfil de dueño
              </h1>
              <p className="mt-2 text-muted-foreground">
                Para reservar espacios y registrar mascotas, necesitamos activar tu perfil de dueño.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
                <h2 className="text-lg font-semibold text-foreground">Al activar tu perfil de dueño podrás:</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Registrar mascotas</li>
                  <li>Reservar espacios</li>
                  <li>Ver tus reservas como dueño</li>
                </ul>
              </div>

              <div className="space-y-4 rounded-xl border border-border bg-background p-5">
                <h2 className="text-lg font-semibold text-foreground">Confirma tus datos</h2>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-foreground">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {showValidation && validationErrors.name && (
                    <p className="mt-1 text-sm text-destructive">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-foreground">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {showValidation && validationErrors.phone && (
                    <p className="mt-1 text-sm text-destructive">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-foreground">
                      Provincia
                    </label>
                    <select
                      value={formData.province}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          province: event.target.value,
                          canton: "",
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecciona</option>
                      {PROVINCES.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    {showValidation && validationErrors.province && (
                      <p className="mt-1 text-sm text-destructive">{validationErrors.province}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-foreground">
                      Cantón
                    </label>
                    <select
                      value={formData.canton}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, canton: event.target.value }))
                      }
                      disabled={!formData.province}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">Selecciona</option>
                      {availableCantons.map((canton) => (
                        <option key={canton} value={canton}>
                          {canton}
                        </option>
                      ))}
                    </select>
                    {showValidation && validationErrors.canton && (
                      <p className="mt-1 text-sm text-destructive">{validationErrors.canton}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-5">
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={confirmActivation}
                    onChange={(event) => setConfirmActivation(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>
                    Confirmo que quiero activar mi perfil de dueño para registrar mascotas y reservar espacios.
                  </span>
                </label>
                {showValidation && !confirmActivation && (
                  <p className="mt-2 text-sm text-destructive">
                    Debes confirmar la activación de tu perfil de dueño.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="sm:flex-1" disabled={submitting || !isFormValid}>
                  {submitting ? "Activando..." : "Activar perfil de dueño"}
                </Button>
                <Button type="button" variant="outline" asChild className="sm:flex-1">
                  <Link to={APP_ROUTES.profile}>Volver a mi perfil</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
