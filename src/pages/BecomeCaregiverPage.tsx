import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CANTONES, PROVINCES } from "@/types";
import { authApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function BecomeCaregiverPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    province: "",
    canton: "",
    bio: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = await authApi.restoreSession().catch(() => null);
      if (!session) {
        navigate("/login?next=%2Fbecome-caregiver", { replace: true });
        return;
      }

      try {
        const user = await authApi.getCurrentUser();
        if (cancelled) return;

        if (user.roles.includes("caregiver")) {
          navigate("/caregiver/dashboard", { replace: true });
          return;
        }

        setEmail(user.email);
        setFormData({
          name: user.name,
          phone: user.phone ?? "",
          province: user.province,
          canton: user.canton,
          bio: user.bio ?? "",
        });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message.toLowerCase().includes("sesion")) {
          navigate("/login?next=%2Fbecome-caregiver", { replace: true });
          return;
        }
        toast({
          title: "No se pudo cargar el onboarding",
          description:
            error instanceof Error
              ? error.message
              : "Intenta nuevamente en unos minutos.",
          variant: "destructive",
        });
        navigate("/profile", { replace: true });
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
    return CANTONES[formData.province as keyof typeof CANTONES] || [];
  }, [formData.province]);

  useEffect(() => {
    if (formData.province && formData.canton && !availableCantons.includes(formData.canton)) {
      setFormData((prev) => ({ ...prev, canton: "" }));
    }
  }, [availableCantons, formData.canton, formData.province]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await authApi.completeCaregiverOnboarding({
        name: formData.name,
        phone: formData.phone,
        province: formData.province as typeof PROVINCES[number],
        canton: formData.canton,
        bio: formData.bio,
      });

      toast({
        title: "Perfil de cuidador completado",
        description: "Ya puedes administrar tu dashboard y crear tus espacios.",
      });
      navigate("/caregiver/dashboard", { replace: true });
    } catch (error) {
      toast({
        title: "No se pudo completar el perfil de cuidador",
        description:
          error instanceof Error
            ? error.message
            : "Intenta nuevamente en unos minutos.",
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
          <p className="text-muted-foreground">Cargando onboarding...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-2xl px-4">
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2 font-heading font-bold text-primary"
          >
            <PawPrint className="h-8 w-8" />
            <span className="text-2xl">Donver</span>
          </Link>

          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Completa tu perfil de cuidador
              </h1>
              <p className="mt-2 text-muted-foreground">
                Tu cuenta ya está creada. Solo falta completar estos datos para activar la experiencia de cuidador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-input bg-muted px-4 py-2 text-muted-foreground"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-foreground">
                    Provincia
                  </label>
                  <select
                    value={formData.province}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        province: event.target.value,
                        canton: "",
                      })
                    }
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecciona</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-foreground">
                    Cantón
                  </label>
                  <select
                    value={formData.canton}
                    onChange={(event) => setFormData({ ...formData, canton: event.target.value })}
                    disabled={!formData.province}
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Selecciona</option>
                    {availableCantons.map((canton) => (
                      <option key={canton} value={canton}>
                        {canton}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Cuéntanos sobre ti
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                  placeholder="Describe tu experiencia cuidando mascotas y qué ofreces como cuidador."
                  required
                  rows={5}
                  className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Guardando..." : "Activar experiencia de cuidador"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
