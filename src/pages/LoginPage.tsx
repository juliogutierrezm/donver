import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { authApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.login(formData);
      toast({
        title: "Sesion iniciada",
        description: "Bienvenido de vuelta a Donver.",
      });
      navigate("/profile");
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
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
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
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 mb-8 font-heading font-bold text-primary"
          >
            <PawPrint className="w-8 h-8" />
            <span className="text-2xl">Donver</span>
          </Link>

          {/* Card */}
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
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
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
