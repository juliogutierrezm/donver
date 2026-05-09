import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { authApi, getDefaultPostAuthPath } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/assets/Logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const next = useMemo(() => searchParams.get("next")?.trim() ?? "", [searchParams]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const session = await authApi.restoreSession().catch(() => null);
      if (!session || cancelled) return;
      navigate(getDefaultPostAuthPath(session.user, next), { replace: true });
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [navigate, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = await authApi.login(formData);
      toast({
        title: "Sesion iniciada",
        description: "Bienvenido de vuelta a Donver.",
      });
      navigate(getDefaultPostAuthPath(session.user, next));
    } catch (error) {
      const isUnconfirmed =
        error instanceof Error &&
        error.message.toLowerCase().includes("no ha sido verificado");

      toast({
        title: "No se pudo iniciar sesion",
        description: isUnconfirmed
          ? "Tu cuenta aun no esta verificada. Te llevaremos a la pantalla para ingresar el codigo."
          : error instanceof Error
            ? error.message
            : "Verifica tus credenciales e intenta de nuevo.",
        variant: "destructive",
      });

      if (isUnconfirmed && formData.email) {
        navigate(
          `/verify-email?email=${encodeURIComponent(formData.email)}${next ? `&next=${encodeURIComponent(next)}` : ""}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <Link to="/" className="flex items-center justify-center">
              <img
                src={Logo}
                alt="Donver logo"
                className="h-14 w-auto"
                style={{ maxHeight: 56 }}
              />
              <span className="sr-only">Donver</span>
            </Link>

            <div className="text-center">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Inicia sesión
              </h1>
              <p className="text-muted-foreground mt-2">
                Bienvenido de vuelta a Donver
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="tu@email.com"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>

            {/* Links */}
            <div className="space-y-2 text-center text-sm">
              <p>
                <a href="#" className="text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </p>
              <p>
                <Link
                  to={formData.email ? `/verify-email?email=${encodeURIComponent(formData.email)}` : "/verify-email"}
                  className="text-primary hover:underline"
                >
                  ¿No has verificado tu correo?
                </Link>
              </p>
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="text-primary hover:underline font-semibold">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
