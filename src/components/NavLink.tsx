import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ to, children, className }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "transition-colors font-medium",
        isActive
          ? "text-primary font-semibold"
          : "text-foreground/70 hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}
