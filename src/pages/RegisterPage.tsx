import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PROVINCES, CANTONES } from "@/types";
import { authApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    canton: "",
    password: "",
    confirmPassword: "",
  });

  const availableCantons = useMemo(() => {
    if (!formData.province)
      return [];
    return CANTONES[formData.province as keyof typeof CANTONES] || [];
  }, [formData.province]);

  useEffect(() => {
    if (formData.province && !availableCantons.includes(formData.canton)) {
      setFormData((prev) => ({ ...prev, canton: "" }));
    }
  }, [availableCantons, formData.canton, formData.province]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        password: formData.password,
        phone: formData.phone,
      });
      toast({
        title: result.confirmed ? "Cuenta creada" : "Revisa tu correo",
        description: result.confirmed
          ? "Tu cuenta ya esta lista para usar Donver."
          : "Cognito envio un codigo de verificacion a tu email. Confirma la cuenta y luego inicia sesion.",
      });
      navigate(
        result.confirmed
          ? "/profile"
          : `/verify-email?email=${encodeURIComponent(formData.email)}`
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
        <div className="max-w-2xl mx-auto px-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 mb-8 font-heading font-bold text-primary"
          >
            <PawPrint className="w-8 h-8" />
            <span className="text-2xl">Donver</span>
          </Link>

          {/* Card */}
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Crea tu cuenta
              </h1>
              <p className="text-muted-foreground mt-2">
                Únete a la comunidad de Donver
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Tu nombre"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

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
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+506 8765 4321"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">
                    Provincia
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        province: e.target.value,
                        canton: "",
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecciona</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">
                    Cantón
                  </label>
                  <select
                    value={formData.canton}
                    onChange={(e) =>
                      setFormData({ ...formData, canton: e.target.value })
                    }
                    disabled={!formData.province}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Selecciona</option>
                    {availableCantons.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
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

              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
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
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>

            {/* Links */}
            <div className="text-center mt-6 text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">
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
