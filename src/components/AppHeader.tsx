import { forwardRef } from "react";
import { useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

const HIDDEN_ROUTES = ["/", "/call"];

const AppHeader = forwardRef<HTMLDivElement>((_, ref) => {
  const { pathname } = useLocation();

  const hidden = HIDDEN_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  if (hidden) return null;

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
  );
});
AppHeader.displayName = "AppHeader";

export default AppHeader;
