import { motion } from 'framer-motion';
import { Palette, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { ColorPalette, ColorSwatch } from './types';

interface ColorPalettePreviewProps {
  colorPalette: ColorPalette | null;
}

const ColorSwatchCard = ({ swatch, label }: { swatch: ColorSwatch; label: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(swatch.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative"
    >
      <button
        onClick={copyToClipboard}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
      >
        <div
          className="h-12 rounded-lg mb-2 shadow-inner border border-border/30 transition-transform group-hover:scale-105"
          style={{ backgroundColor: swatch.hex }}
        />
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground capitalize">{label}</p>
          <p className="text-xs text-muted-foreground font-mono">{swatch.hex}</p>
          <p className="text-xs text-muted-foreground/70 line-clamp-1">{swatch.name}</p>
        </div>
      </button>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="w-3 h-3 text-primary" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    </motion.div>
  );
};

const ColorPalettePreview = ({ colorPalette }: ColorPalettePreviewProps) => {
  if (!colorPalette) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Palette className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No color palette yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Upload a mood board to extract colors
          </p>
        </div>
      </div>
    );
  }

  const swatches: { key: keyof Omit<ColorPalette, 'harmony' | 'mood'>; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'text', label: 'Text' },
    { key: 'muted', label: 'Muted' },
    { key: 'border', label: 'Border' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Color Grid */}
        <div className="grid grid-cols-2 gap-3">
          {swatches.map(({ key, label }) => (
            <ColorSwatchCard
              key={key}
              swatch={colorPalette[key] as ColorSwatch}
              label={label}
            />
          ))}
        </div>

        {/* Harmony & Mood */}
        <div className="pt-3 border-t border-border/50 space-y-2">
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Color Harmony</p>
            <p className="text-xs text-muted-foreground">{colorPalette.harmony}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Mood</p>
            <p className="text-xs text-muted-foreground">{colorPalette.mood}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ColorPalettePreview;
