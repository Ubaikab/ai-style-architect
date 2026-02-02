import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Coins, LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          ) : user ? (
            <>
              <div className="credit-badge">
                <Coins className="w-4 h-4" />
                <span>{profile?.credits ?? 0} credits</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button variant="gradient" onClick={() => navigate("/auth?mode=signup")}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
