import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { authApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const next = useMemo(() => searchParams.get("next")?.trim() ?? "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      await authApi.confirmSignUp(email, code);
      toast({
        title: "Correo verificado",
        description: "Tu cuenta ya fue confirmada. Ahora puedes iniciar sesion.",
      });
      navigate(
        `/login?email=${encodeURIComponent(email)}${next ? `&next=${encodeURIComponent(next)}` : ""}`
      );
    } catch (error) {
      toast({
        title: "No se pudo verificar el correo",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);

    try {
      await authApi.resendSignUpCode(email);
      toast({
        title: "Codigo reenviado",
        description: "Revisa tu correo para obtener el nuevo codigo de verificacion.",
      });
    } catch (error) {
      toast({
        title: "No se pudo reenviar el codigo",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 mb-8 font-heading font-bold text-primary"
          >
            <PawPrint className="w-8 h-8" />
            <span className="text-2xl">Donver</span>
          </Link>

          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Verifica tu correo
              </h1>
              <p className="text-muted-foreground mt-2">
                Ingresa el codigo que Cognito envio a tu email para activar tu cuenta.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  Codigo de verificacion
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full" disabled={verifying || resending}>
                {verifying ? "Verificando..." : "Verificar correo"}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handleResendCode()}
              disabled={!email || verifying || resending}
            >
              {resending ? "Reenviando..." : "Reenviar codigo"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya verificaste tu cuenta?{" "}
              <Link
                to={`/login${email ? `?email=${encodeURIComponent(email)}${next ? `&next=${encodeURIComponent(next)}` : ""}` : next ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="text-primary hover:underline font-semibold"
              >
                Inicia sesion
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
