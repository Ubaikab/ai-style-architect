import { useState } from 'react';
import { Download, Check, FileCode, Copy, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GeneratedUI, TypographySystem, ColorPalette } from './types';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  generatedUI: GeneratedUI | null;
  typography?: TypographySystem | null;
  colorPalette?: ColorPalette | null;
}

const ExportButton = ({ generatedUI, typography, colorPalette }: ExportButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateDesignTokens = () => {
    const tokens: Record<string, unknown> = {};

    if (typography?.typography) {
      tokens.typography = {
        fonts: typography.typography.fonts,
        scale: typography.typography.scale,
        colors: typography.typography.colors,
      };
    }

    if (colorPalette) {
      tokens.colors = colorPalette;
    }

    if (generatedUI) {
      tokens.generatedUI = {
        prompt: generatedUI.prompt,
        description: generatedUI.description,
        designNotes: generatedUI.designNotes,
      };
    }

    return JSON.stringify(tokens, null, 2);
  };

  const generateTailwindConfig = () => {
    if (!colorPalette) return '';

    return `// Tailwind CSS configuration generated from your design system
// Add these to your tailwind.config.ts extend.colors section

const designColors = {
  primary: '${colorPalette.primary.hex}',
  secondary: '${colorPalette.secondary.hex}',
  accent: '${colorPalette.accent.hex}',
  background: '${colorPalette.background.hex}',
  surface: '${colorPalette.surface.hex}',
  foreground: '${colorPalette.text.hex}',
  muted: '${colorPalette.muted.hex}',
  border: '${colorPalette.border.hex}',
};

export default designColors;
`;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: `${filename} has been downloaded`,
    });
  };

  const downloadImage = () => {
    if (!generatedUI?.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedUI.imageUrl;
    link.download = `generated-ui-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Downloaded!',
      description: 'UI image has been downloaded',
    });
  };

  const copyImageToClipboard = async () => {
    if (!generatedUI?.imageBase64) return;
    
    try {
      // Convert base64 to blob
      const byteString = atob(generatedUI.imageBase64);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'image/png' });
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Image copied to clipboard',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not copy image to clipboard',
        variant: 'destructive',
      });
    }
  };

  const hasAnything = generatedUI || typography || colorPalette;
  if (!hasAnything) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {generatedUI?.imageUrl && (
          <>
            <DropdownMenuItem onClick={downloadImage}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Download UI Image
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={copyImageToClipboard}>
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-primary" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy Image
            </DropdownMenuItem>
          </>
        )}

        {(typography || colorPalette) && (
          <>
            <DropdownMenuItem
              onClick={() => downloadFile(
                generateDesignTokens(),
                'design-tokens.json',
                'application/json'
              )}
            >
              <FileCode className="w-4 h-4 mr-2" />
              Download Design Tokens
            </DropdownMenuItem>

            {colorPalette && (
              <DropdownMenuItem
                onClick={() => downloadFile(
                  generateTailwindConfig(),
                  'design-colors.ts',
                  'text/typescript'
                )}
              >
                <FileCode className="w-4 h-4 mr-2" />
                Download Tailwind Colors
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
