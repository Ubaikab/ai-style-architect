import { Sparkles } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 blur-xl bg-primary/50 rounded-full" />
        <div className={`relative ${sizes[size]} rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center`}>
          <Sparkles className="w-1/2 h-1/2 text-white" />
        </div>
      </div>
      {showText && (
        <span className={`font-display font-bold ${textSizes[size]} gradient-text`}>
          DesignForge
        </span>
      )}
    </div>
  );
}
