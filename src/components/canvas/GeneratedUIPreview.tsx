import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GeneratedUI } from './types';
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Pencil,
  MousePointer,
  Maximize2 } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface GeneratedUIPreviewProps {
  generatedUI: GeneratedUI | null;
  isLoading: boolean;
  onRegenerateArea?: (area: {x: number;y: number;width: number;height: number;}, prompt: string) => void;
  onDrawOver?: (enabled: boolean) => void;
}

type EditMode = 'view' | 'move' | 'draw' | 'select';

const GeneratedUIPreview = ({
  generatedUI,
  isLoading,
  onRegenerateArea,
  onDrawOver
}: GeneratedUIPreviewProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState<EditMode>('view');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{x: number;y: number;width: number;height: number;} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (editMode === 'move') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (editMode === 'select' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setIsSelecting(true);
      setSelectionStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setSelection(null);
    }
  }, [editMode, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && editMode === 'move') {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isSelecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      setSelection({
        x: Math.min(selectionStart.x, currentX),
        y: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y)
      });
    }
  }, [isDragging, isSelecting, dragStart, selectionStart, editMode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    if (editMode === 'draw') {
      onDrawOver?.(true);
    } else {
      onDrawOver?.(false);
    }
  }, [editMode, onDrawOver]);

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

  const handleRegenerateSelection = () => {
    if (!selection || !onRegenerateArea) return;

    const prompt = window.prompt('Describe what you want in this area:');
    if (prompt) {
      onRegenerateArea(selection, prompt);
      setSelection(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full border-2 border-primary/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-foreground font-medium">Creating your UI...</p>
          <p className="text-sm text-muted-foreground mt-1">Applying your design system</p>
        </div>
      </div>);

  }

  if (!generatedUI?.imageUrl) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-muted">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Maximize2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">Your UI Will Appear Here</p>
          <p className="text-sm text-muted-foreground">
            Draw a sketch and describe your vision<br />in the chat to generate
          </p>
        </div>
      </div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-[repeating-linear-gradient(45deg,var(--secondary)_0,var(--secondary)_10px,transparent_10px,transparent_20px)]">

      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Button
            variant={editMode === 'view' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditMode('view')}
            title="View">

            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant={editMode === 'move' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditMode('move')}
            title="Move & Resize">

            <Move className="w-4 h-4" />
          </Button>
          <Button
            variant={editMode === 'draw' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditMode('draw')}
            title="Draw Over">

            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={editMode === 'select' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditMode('select')}
            title="Select Area to Regenerate">

            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

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
              onValueChange={([v]) => setScale(v / 100)} />

          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: editMode === 'move' ? 'grab' : editMode === 'select' ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}>

          <img
            src={generatedUI.imageUrl}
            alt="Generated UI"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            draggable={false} />

        </div>

        {/* Selection Overlay */}
        {selection &&
        <div
          className="absolute border-2 border-primary border-dashed bg-primary/10"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height
          }}>

            {!isSelecting && selection.width > 50 && selection.height > 30 &&
          <Button
            size="sm"
            className="absolute -bottom-10 left-1/2 -translate-x-1/2"
            onClick={handleRegenerateSelection}>

                Regenerate Area
              </Button>
          }
          </div>
        }
      </div>

      {/* Design Notes */}
      {generatedUI.designNotes && generatedUI.designNotes.length > 0 &&
      <div className="p-2 border-t border-border/50 bg-background/95">
          <div className="flex flex-wrap gap-1">
            {generatedUI.designNotes.map((note, i) =>
          <span
            key={i}
            className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">

                {note}
              </span>
          )}
          </div>
        </div>
      }
    </motion.div>);

};

export default GeneratedUIPreview;