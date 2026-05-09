import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CANTONES, PROVINCES, type UserRole } from "@/types";
import { authApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/assets/Logo.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    canton: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const session = await authApi.restoreSession().catch(() => null);
      if (!session || cancelled) return;
      navigate("/profile", { replace: true });
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "Revisa la confirmacion de contrasena para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        province: formData.province as typeof PROVINCES[number],
        canton: formData.canton,
        password: formData.password,
        signupIntent: selectedRole === "caregiver" ? "caregiver" : null,
      });

      const next =
        selectedRole === "caregiver"
          ? `&next=${encodeURIComponent("/become-caregiver")}`
          : "";

      toast({
        title: result.confirmed ? "Cuenta creada" : "Revisa tu correo",
        description: result.confirmed
          ? "Tu cuenta ya fue creada. Inicia sesion para continuar."
          : "Cognito envio un codigo de verificacion a tu email. Confirma la cuenta y luego inicia sesion.",
      });

      navigate(
        result.confirmed
          ? `/login?email=${encodeURIComponent(formData.email)}${next}`
          : `/verify-email?email=${encodeURIComponent(formData.email)}${next}`
      );
    } catch (error) {
      toast({
        title: "No se pudo crear la cuenta",
        description:
          error instanceof Error
            ? error.message
            : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl border border-border bg-card p-8">
            <Link to="/" className="mb-6 flex items-center justify-center">
              <img
                src={Logo}
                alt="Donver logo"
                className="h-14 w-auto"
                style={{ maxHeight: 56 }}
              />
              <span className="sr-only">Donver</span>
            </Link>

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Crea tu cuenta
              </h1>
              <p className="mt-2 text-muted-foreground">
                Únete a la comunidad de Donver
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Quiero registrarme como
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("owner")}
                    className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                      selectedRole === "owner"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/60"
                    }`}
                  >
                    <span className="block font-semibold">Dueño</span>
                    <span className="block text-sm text-muted-foreground">
                      Buscar y reservar espacios para tus mascotas
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("caregiver")}
                    className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                      selectedRole === "caregiver"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/60"
                    }`}
                  >
                    <span className="block font-semibold">Cuidador</span>
                    <span className="block text-sm text-muted-foreground">
                      Te llevaremos al onboarding de cuidador después de verificar e iniciar sesión
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Tu nombre"
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
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  placeholder="+506 8765 4321"
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
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-12 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        confirmPassword: event.target.value,
                      })
                    }
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-12 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Creando cuenta..."
                  : selectedRole === "caregiver"
                    ? "Crear cuenta y continuar como cuidador"
                    : "Crear cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
