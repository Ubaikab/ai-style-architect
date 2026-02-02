import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validate = () => {
    try {
      if (isSignUp) {
        authSchema.parse({ email, password, displayName: displayName || undefined });
      } else {
        authSchema.pick({ email: true, password: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (!error) {
        // Stay on page to show email confirmation message
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        navigate("/dashboard");
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Logo size="lg" />
            <h1 className="mt-6 text-3xl font-display font-bold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isSignUp
                ? "Start creating beautiful design systems with AI"
                : "Sign in to access your design projects"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border/50"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border/50"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border/50"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="absolute inset-0 glow-effect" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6 p-12 max-w-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-3xl font-display font-bold">
              Transform inspiration into design systems
            </h2>
            <p className="text-muted-foreground text-lg">
              Upload your mood boards and let AI generate comprehensive style guides with colors, typography, and design tokens.
            </p>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
