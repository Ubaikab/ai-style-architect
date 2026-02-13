import { useRef, useCallback, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { 
  CanvasElement as CanvasElementType,
  StructuredTool,
  Position,
  Bounds,
  ResizeHandle,
  SnapGuide
} from '../types/elements';
import CanvasElementComponent from './CanvasElement';

interface StructuredCanvasRendererProps {
  elements: Record<string, CanvasElementType>;
  rootIds: string[];
  selectedIds: string[];
  hoveredId: string | null;
  activeTool: StructuredTool;
  snapGuides: SnapGuide[];
  onSelect: (id: string | null, addToSelection: boolean) => void;
  onMove: (id: string, delta: Position) => void;
  onResize: (id: string, newBounds: Bounds) => void;
  onStartDrawing: (position: Position) => void;
  onContinueDrawing: (position: Position) => void;
  onStopDrawing: (position: Position) => void;
  onHover: (id: string | null) => void;
  onSaveHistory?: () => void;
}

const GRID_SIZE = 10;
const SNAP_THRESHOLD = 5;

const StructuredCanvasRenderer = memo(({
  elements,
  rootIds,
  selectedIds,
  hoveredId,
  activeTool,
  snapGuides,
  onSelect,
  onMove,
  onResize,
  onStartDrawing,
  onContinueDrawing,
  onStopDrawing,
  onHover,
  onSaveHistory
}: StructuredCanvasRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragElement, setDragElement] = useState<string | null>(null);
  const [resizeElement, setResizeElement] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartBounds, setResizeStartBounds] = useState<Bounds | null>(null);
  const [drawPreview, setDrawPreview] = useState<Bounds | null>(null);

  const getCanvasPosition = useCallback((e: React.MouseEvent): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);
    
    if (activeTool === 'hand' || (e.button === 1) || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (activeTool === 'select') {
      // Clicking on empty space deselects
      onSelect(null, false);
      return;
    }

    // Start drawing new element
    setDragStart(pos);
    onStartDrawing(pos);
    setDrawPreview({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, [activeTool, pan, getCanvasPosition, onSelect, onStartDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);

    if (isPanning && dragStart) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (isDragging && dragElement && dragStart) {
      const delta = {
        x: snapToGrid(pos.x - dragStart.x),
        y: snapToGrid(pos.y - dragStart.y)
      };
      onMove(dragElement, delta);
      setDragStart(pos);
      return;
    }

    if (isResizing && resizeElement && resizeHandle && resizeStartBounds && dragStart) {
      const element = elements[resizeElement];
      if (!element) return;

      let newBounds = { ...resizeStartBounds };
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      switch (resizeHandle) {
        case 'top-left':
          newBounds.x = snapToGrid(resizeStartBounds.x + dx);
          newBounds.y = snapToGrid(resizeStartBounds.y + dy);
          newBounds.width = Math.max(20, resizeStartBounds.width - dx);
          newBounds.height = Math.max(20, resizeStartBounds.height - dy);
          break;
        case 'top':
          newBounds.y = snapToGrid(resizeStartBounds.y + dy);
          newBounds.height = Math.max(20, resizeStartBounds.height - dy);
          break;
        case 'top-right':
          newBounds.y = snapToGrid(resizeStartBounds.y + dy);
          newBounds.width = Math.max(20, resizeStartBounds.width + dx);
          newBounds.height = Math.max(20, resizeStartBounds.height - dy);
          break;
        case 'right':
          newBounds.width = Math.max(20, snapToGrid(resizeStartBounds.width + dx));
          break;
        case 'bottom-right':
          newBounds.width = Math.max(20, snapToGrid(resizeStartBounds.width + dx));
          newBounds.height = Math.max(20, snapToGrid(resizeStartBounds.height + dy));
          break;
        case 'bottom':
          newBounds.height = Math.max(20, snapToGrid(resizeStartBounds.height + dy));
          break;
        case 'bottom-left':
          newBounds.x = snapToGrid(resizeStartBounds.x + dx);
          newBounds.width = Math.max(20, resizeStartBounds.width - dx);
          newBounds.height = Math.max(20, snapToGrid(resizeStartBounds.height + dy));
          break;
        case 'left':
          newBounds.x = snapToGrid(resizeStartBounds.x + dx);
          newBounds.width = Math.max(20, resizeStartBounds.width - dx);
          break;
      }

      onResize(resizeElement, newBounds);
      return;
    }

    // Drawing preview
    if (dragStart && activeTool !== 'select' && activeTool !== 'hand') {
      setDrawPreview({
        x: Math.min(dragStart.x, pos.x),
        y: Math.min(dragStart.y, pos.y),
        width: Math.abs(pos.x - dragStart.x),
        height: Math.abs(pos.y - dragStart.y)
      });
      onContinueDrawing(pos);
    }
  }, [
    isPanning, isDragging, isResizing, dragStart, dragElement, 
    resizeElement, resizeHandle, resizeStartBounds, activeTool,
    elements, getCanvasPosition, snapToGrid, onMove, onResize, onContinueDrawing
  ]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);

    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      setDragElement(null);
      setDragStart(null);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeElement(null);
      setResizeHandle(null);
      setResizeStartBounds(null);
      setDragStart(null);
      return;
    }

    if (dragStart && activeTool !== 'select' && activeTool !== 'hand') {
      onStopDrawing(pos);
      setDragStart(null);
      setDrawPreview(null);
    }
  }, [isPanning, isDragging, isResizing, dragStart, activeTool, getCanvasPosition, onStopDrawing]);

  const handleStartDrag = useCallback((id: string, e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);
    onSaveHistory?.();
    setIsDragging(true);
    setDragElement(id);
    setDragStart(pos);
  }, [getCanvasPosition, onSaveHistory]);

  const handleStartResize = useCallback((id: string, handle: ResizeHandle, e: React.MouseEvent) => {
    const element = elements[id];
    if (!element) return;
    
    const pos = getCanvasPosition(e);
    onSaveHistory?.();
    setIsResizing(true);
    setResizeElement(id);
    setResizeHandle(handle);
    setResizeStartBounds({ ...element.bounds });
    setDragStart(pos);
  }, [elements, getCanvasPosition, onSaveHistory]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(3, Math.max(0.1, prev * delta)));
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't block space in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCursor = () => {
    if (isPanning || activeTool === 'hand') return 'grab';
    if (isDragging) return 'grabbing';
    if (activeTool === 'select') return 'default';
    return 'crosshair';
  };

  // Get all root elements in order
  const sortedRootElements = rootIds
    .map(id => elements[id])
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-[#1a1a2e]"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Canvas transform container */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* Render elements */}
        {sortedRootElements.map(element => (
          <CanvasElementComponent
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            isHovered={hoveredId === element.id}
            onSelect={onSelect}
            onStartDrag={handleStartDrag}
            onStartResize={handleStartResize}
            zoom={zoom}
          />
        ))}

        {/* Drawing preview */}
        {drawPreview && drawPreview.width > 0 && drawPreview.height > 0 && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
            style={{
              left: drawPreview.x,
              top: drawPreview.y,
              width: drawPreview.width,
              height: drawPreview.height
            }}
          />
        )}
      </div>

      {/* Snap guides */}
      {snapGuides.map((guide, i) => (
        <div
          key={i}
          className="absolute bg-primary pointer-events-none"
          style={
            guide.type === 'horizontal'
              ? {
                  left: guide.start * zoom + pan.x,
                  top: guide.position * zoom + pan.y,
                  width: (guide.end - guide.start) * zoom,
                  height: 1
                }
              : {
                  left: guide.position * zoom + pan.x,
                  top: guide.start * zoom + pan.y,
                  width: 1,
                  height: (guide.end - guide.start) * zoom
                }
          }
        />
      ))}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(0.1, prev * 0.8)); }}
          className="p-1 rounded hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-muted-foreground min-w-[3rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(3, prev * 1.25)); }}
          className="p-1 rounded hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-border/50 mx-0.5" />
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1 rounded hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-colors"
          title="Reset View"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

StructuredCanvasRenderer.displayName = 'StructuredCanvasRenderer';

export default StructuredCanvasRenderer;
