import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { s2cApi } from '@/lib/api/s2c';
import { TypographySystem, ColorPalette } from '../types';
import TypographyPreview from '../TypographyPreview';
import ColorPalettePreview from '../ColorPalettePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MoodboardSectionProps {
  typography: TypographySystem | null;
  colorPalette: ColorPalette | null;
  onTypographyExtracted: (typography: TypographySystem) => void;
  onColorPaletteExtracted: (palette: ColorPalette) => void;
  onMoodboardUploaded: (base64: string) => void;
}

const MoodboardSection = ({
  typography,
  colorPalette,
  onTypographyExtracted,
  onColorPaletteExtracted,
  onMoodboardUploaded
}: MoodboardSectionProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      const base64 = result.split(',')[1];
      onMoodboardUploaded(base64);
      
      // Extract design system
      setIsLoading(true);
      try {
        const response = await s2cApi.extractTypography(base64);
        if (response.success && response.data) {
          onTypographyExtracted(response.data);
          if (response.data.colorPalette) {
            onColorPaletteExtracted(response.data.colorPalette);
          }
          toast({
            title: 'Design System Extracted!',
            description: 'Typography and colors generated from your mood board',
          });
        }
      } catch {
        toast({
          title: 'Extraction Failed',
          description: 'Could not analyze the image',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, [toast, onMoodboardUploaded, onTypographyExtracted, onColorPaletteExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearImage = useCallback(() => {
    setPreview(null);
  }, []);

  const hasDesignSystem = !!(typography || colorPalette);

  return (
    <section className="py-12 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card mb-4">
            <span className="text-xs font-medium">Step 1</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Upload Your Mood Board
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload an image that represents your design vision. We'll extract colors, typography, and design tokens automatically.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Area */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {!preview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer h-64 flex items-center justify-center ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Drop mood board here</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-border h-64">
                  <img
                    src={preview}
                    alt="Mood board preview"
                    className="w-full h-full object-cover"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Analyzing design...</span>
                      </div>
                    </div>
                  )}
                  {!isLoading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearImage}
                      className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {hasDesignSystem && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-foreground font-medium">Design system ready!</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Design System Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl glass-card overflow-hidden"
            >
              {hasDesignSystem ? (
                <Tabs defaultValue="colors" className="h-64">
                  <TabsList className="w-full rounded-none border-b border-border">
                    <TabsTrigger value="colors" className="flex-1">
                      <Palette className="w-4 h-4 mr-2" />
                      Colors
                    </TabsTrigger>
                    <TabsTrigger value="typography" className="flex-1">
                      <span className="font-bold mr-2">Aa</span>
                      Typography
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="colors" className="h-[calc(100%-41px)] overflow-y-auto m-0">
                    <ColorPalettePreview colorPalette={colorPalette} />
                  </TabsContent>
                  <TabsContent value="typography" className="h-[calc(100%-41px)] overflow-y-auto m-0">
                    <TypographyPreview typography={typography} />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-64 flex items-center justify-center p-6 text-center">
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
                      <Palette className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a mood board to extract<br />your design system
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoodboardSection;
