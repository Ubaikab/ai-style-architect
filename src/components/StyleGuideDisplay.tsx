import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Type, Layers, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ColorSection {
  name: string;
  hex: string;
  usage: string;
}

interface TypographySection {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  usage: string;
}

interface StyleGuide {
  theme: {
    name: string;
    description: string;
    mood: string[];
  };
  colors: ColorSection[];
  typography: TypographySection[];
  recommendations?: string[];
}

interface StyleGuideDisplayProps {
  styleGuide: Record<string, unknown>;
}

export function StyleGuideDisplay({ styleGuide }: StyleGuideDisplayProps) {
  const guide = styleGuide as unknown as StyleGuide;
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string, colorName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Theme Overview */}
      <Card className="glass-card overflow-hidden">
        <div className="h-2 w-full flex">
          {guide.colors?.slice(0, 6).map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {guide.theme?.name || "Design System"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {guide.theme?.description}
          </p>
          {guide.theme?.mood && (
            <div className="flex flex-wrap gap-2">
              {guide.theme.mood.map((m, i) => (
                <Badge key={i} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {guide.colors?.map((color, i) => (
              <div
                key={i}
                className="group rounded-xl overflow-hidden glass-card cursor-pointer transition-all hover:scale-105"
                onClick={() => copyToClipboard(color.hex, color.name)}
              >
                <div
                  className="h-24 w-full relative"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    {copiedColor === color.name ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Copy className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {color.hex}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {color.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Type className="w-5 h-5 text-secondary" />
            </div>
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {guide.typography?.map((type, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{type.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {type.usage}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {type.fontFamily}
                  </Badge>
                </div>
                <div
                  className="text-foreground"
                  style={{
                    fontFamily: type.fontFamily,
                    fontSize: type.fontSize,
                    fontWeight: type.fontWeight as unknown as number,
                    lineHeight: type.lineHeight,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground font-mono">
                  <span>Size: {type.fontSize}</span>
                  <span>Weight: {type.fontWeight}</span>
                  <span>Line Height: {type.lineHeight}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {guide.recommendations && guide.recommendations.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display">
              Design Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {guide.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-muted-foreground">{rec}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
