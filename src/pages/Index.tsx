import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  Palette,
  Type,
  Zap,
  Check,
  ArrowRight,
  Upload,
  Cpu,
  Layers,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Upload,
      title: "Upload Mood Boards",
      description: "Drop your inspiration images and let AI analyze the visual patterns.",
    },
    {
      icon: Cpu,
      title: "AI-Powered Analysis",
      description: "Google Gemini extracts colors, typography hints, and design themes.",
    },
    {
      icon: Layers,
      title: "Structured Output",
      description: "Get a validated, schema-compliant style guide ready for development.",
    },
  ];

  const styleGuideFeatures = [
    "Complete color palette with hex codes",
    "Typography scale with font recommendations",
    "Design tokens for consistent theming",
    "Usage guidelines for each element",
    "Dark mode considerations",
    "Accessibility contrast ratios",
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 glow-effect" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">AI-Powered Design System Generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            Transform Inspiration into
            <span className="block gradient-text">Design Systems</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "200ms" }}>
            Upload your mood boards and watch AI generate comprehensive style guides with colors, typography, and design tokens—all validated and ready for development.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button
              variant="gradient"
              size="xl"
              onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
            >
              {user ? "Go to Dashboard" : "Start Creating"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to generate your AI-powered design system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-8 text-center group hover:border-primary/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Complete Style Guides in Seconds
              </h2>
              <p className="text-muted-foreground mb-8">
                Our AI analyzes your mood board images to extract meaningful design patterns and generates production-ready style guides with validated data.
              </p>
              <ul className="space-y-4">
                {styleGuideFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 space-y-4">
              {/* Mock style guide preview */}
              <div className="flex gap-2 mb-6">
                {["#FF6B4A", "#9B59B6", "#1A1A2E", "#EAEAEA", "#2ECC71"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-16 rounded-lg first:rounded-l-xl last:rounded-r-xl"
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Palette className="w-5 h-5 text-primary" />
                  <span className="font-medium">Primary Colors</span>
                  <span className="text-muted-foreground text-sm ml-auto">
                    5 colors extracted
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Type className="w-5 h-5 text-secondary" />
                  <span className="font-medium">Typography Scale</span>
                  <span className="text-muted-foreground text-sm ml-auto">
                    6 text styles
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Zap className="w-5 h-5 text-warning" />
                  <span className="font-medium">Design Tokens</span>
                  <span className="text-muted-foreground text-sm ml-auto">
                    Ready to export
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Ready to Transform Your Design Process?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Start with 5 free credits. No credit card required.
              </p>
              <Button
                variant="gradient"
                size="xl"
                onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2024 DesignForge. AI-powered design systems.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Powered by <Sparkles className="w-4 h-4 text-primary mx-1" /> Lovable AI
          </div>
        </div>
      </footer>
    </div>
  );
}
