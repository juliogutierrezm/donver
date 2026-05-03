import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavLink({ to, children, className, onClick }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
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
