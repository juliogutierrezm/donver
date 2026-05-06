import { Link } from "react-router-dom";
import { Menu, MessageSquare, User, X } from "lucide-react";
import { useState } from "react";
import DonverLogo from "@/assets/Donver-logo.png";
import Logo from "@/assets/Logo.png";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuthSessionUser } from "@/hooks/useAuthSessionUser";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { authenticated, experienceMode } = useAuthSessionUser();
  const unreadCount = authenticated ? 1 : 0;

  const navLinks = [
    { label: "Inicio", to: "/" },
    { label: "Espacios", to: "/spaces" },
    { label: "¿Cómo funciona?", to: "/how-it-works" },
    { label: "Ayuda", to: "/help" },
  ];

  const caregiverCta =
    experienceMode === "caregiver_pending"
      ? { label: "Continuar registro", to: "/become-caregiver" }
      : experienceMode === "caregiver" || experienceMode === "both"
        ? { label: "Dashboard cuidador", to: "/caregiver/dashboard" }
        : { label: "Ser cuidador", to: "/become-caregiver" };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-soft">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-primary hover-lift">
          <img
            src={Logo}
            alt="Donver logo"
            className="h-10 w-auto"
            style={{ maxHeight: 40 }}
          />
          <span className="sr-only">Donver</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {authenticated ? (
            <>
              <Link to={caregiverCta.to}>
                <Button variant={experienceMode === "owner" ? "outline" : "default"}>
                  {caregiverCta.label}
                </Button>
              </Link>
              <Link to="/messages" className="relative">
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Iniciar sesión</Button>
              </Link>
              <Link to="/register">
                <Button>Registrarse</Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen((current) => !current)}
          className="rounded-lg p-2 transition-colors hover:bg-accent md:hidden"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="animate-in border-t border-border bg-card md:hidden">
          <div className="space-y-3 px-4 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div
              className={cn(
                "space-y-2 border-t border-border pt-3",
                authenticated && "flex flex-col gap-2",
              )}
            >
              {authenticated ? (
                <>
                  <Link to={caregiverCta.to} onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">{caregiverCta.label}</Button>
                  </Link>
                  <Link to="/messages" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Mensajes
                      {unreadCount > 0 && (
                        <span className="ml-auto rounded bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      Mi perfil
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">Registrarse</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
