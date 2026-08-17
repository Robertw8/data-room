import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Brand from "@/components/Brand";

interface AuthenticatedHeaderProps {
  email: string;
  onLogout: () => void;
}

const AuthenticatedHeader = ({ email, onLogout }: AuthenticatedHeaderProps) => {
  const { pathname } = useLocation();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <Link
            aria-label="Cyan Data Room home"
            className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to="/app"
          >
            <Brand compact />
          </Link>
          <p className="mt-1 truncate pl-11 text-xs text-muted-foreground">
            {email}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-1"
          >
            <Button asChild size="sm" variant="ghost">
              <NavLink
                className={
                  pathname === "/app"
                    ? "bg-accent text-accent-foreground"
                    : undefined
                }
                to="/app"
              >
                Data Rooms
              </NavLink>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <NavLink
                className={
                  pathname === "/shares/received"
                    ? "bg-accent text-accent-foreground"
                    : undefined
                }
                to="/shares/received"
              >
                Shared with me
              </NavLink>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <NavLink
                className={
                  pathname === "/shares/created"
                    ? "bg-accent text-accent-foreground"
                    : undefined
                }
                to="/shares/created"
              >
                Shared by me
              </NavLink>
            </Button>
          </nav>
          <Button className="ml-2" variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
