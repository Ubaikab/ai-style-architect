import { motion } from 'framer-motion';
import { Eye, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState, useRef } from 'react';
import { GeneratedUI } from '../types';
import { useToast } from '@/hooks/use-toast';

interface VisionSectionProps {
  generatedUI: GeneratedUI | null;
  isLoading: boolean;
}

const VisionSection = ({ generatedUI, isLoading }: VisionSectionProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (!generatedUI?.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedUI.imageUrl;
    link.download = `generated-ui-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Downloaded!',
      description: 'UI image saved to your device'
    });
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card mb-4">
            <span className="text-xs font-medium">Step 4</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Preview Your Design
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See your generated UI design. Download it or refine it further with the Design Assistant.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-2xl glass-card overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">UI Preview</span>
              </div>

              {generatedUI?.imageUrl && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[scale * 100]}
                      min={25}
                      max={300}
                      step={25}
                      onValueChange={([v]) => setScale(v / 100)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12">{Math.round(scale * 100)}%</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-2" />
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Preview Area */}
            <div
              ref={containerRef}
              className="h-[500px] overflow-hidden relative bg-[repeating-linear-gradient(45deg,hsl(var(--secondary))_0,hsl(var(--secondary))_10px,transparent_10px,transparent_20px)]"
              style={{ cursor: generatedUI?.imageUrl ? 'grab' : 'default' }}
              onMouseDown={generatedUI?.imageUrl ? handleMouseDown : undefined}
              onMouseMove={generatedUI?.imageUrl ? handleMouseMove : undefined}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    </div>
                    <p className="text-foreground font-medium">Generating your UI...</p>
                    <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
                  </div>
                </div>
              ) : generatedUI?.imageUrl ? (
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center center'
                  }}
                >
                  <img
                    src={generatedUI.imageUrl}
                    alt="Generated UI"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Maximize2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Your Design Will Appear Here</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Create a layout in the Canvas section, then describe your vision in the Design Assistant
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Design Notes */}
            {generatedUI?.designNotes && generatedUI.designNotes.length > 0 && (
              <div className="px-4 py-3 border-t border-border/50 bg-card/30">
                <div className="flex flex-wrap gap-2">
                  {generatedUI.designNotes.map((note, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
