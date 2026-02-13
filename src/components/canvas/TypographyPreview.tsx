import { motion } from 'framer-motion';
import { TypographySystem } from './types';
import { Type, Palette } from 'lucide-react';

interface TypographyPreviewProps {
  typography: TypographySystem | null;
}

const TypographyPreview = ({ typography }: TypographyPreviewProps) => {
  if (!typography?.typography) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
            <Type className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            Upload a mood board to generate<br />typography system
          </p>
        </div>
      </div>
    );
  }

  const { fonts, scale, colors, aesthetic } = typography.typography;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto p-4 space-y-6"
    >
      {/* Aesthetic description */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm text-foreground">{aesthetic}</p>
      </div>

      {/* Font Families */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Type className="w-3 h-3" />
          Font Families
        </h4>
        <div className="space-y-2">
          {Object.entries(fonts).map(([key, font]) => (
            <div key={key} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-muted-foreground capitalize">{key}</span>
                <span className="text-xs text-primary font-mono">{font.family}</span>
              </div>
              <p 
                className="text-lg font-medium"
                style={{ fontFamily: `${font.family}, ${font.fallback}` }}
              >
                The quick brown fox
              </p>
              <p className="text-xs text-muted-foreground mt-1">{font.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Type Scale */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Type Scale
        </h4>
        <div className="space-y-2">
          {Object.entries(scale).slice(0, 5).map(([key, style]) => (
            <div 
              key={key} 
              className="flex items-baseline justify-between p-2 rounded bg-secondary/20 border border-border/30"
            >
              <span
                style={{
                  fontSize: style.size,
                  fontWeight: style.weight,
                  lineHeight: style.lineHeight,
                  letterSpacing: style.letterSpacing,
                }}
              >
                {key.toUpperCase()}
              </span>
              <div className="text-right">
                <span className="text-xs font-mono text-muted-foreground">{style.size}</span>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <span className="text-xs font-mono text-muted-foreground">{style.weight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Colors
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(colors).map(([key, color]) => (
            <div key={key} className="text-center">
              <div
                className="w-full aspect-square rounded-lg border border-border/50 mb-1"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground capitalize">
                {key.replace('text', '')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TypographyPreview;
