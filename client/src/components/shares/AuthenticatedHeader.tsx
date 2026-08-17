import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AuthenticatedHeaderProps {
  email: string;
  onLogout: () => void;
}

const AuthenticatedHeader = ({ email, onLogout }: AuthenticatedHeaderProps) => (
  <header className="border-b bg-background">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <div>
        <p className="text-lg font-semibold">Data Room</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1">
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link to="/app">Data Rooms</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/shares/received">Shared with me</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/shares/created">Shared by me</Link>
          </Button>
        </nav>
        <Button className="ml-2" variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  </header>
);

export default AuthenticatedHeader;
