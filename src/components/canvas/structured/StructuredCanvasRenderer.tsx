import { useRef, useCallback, useEffect, useState, memo } from 'react';
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
  onSelectByRect?: (rect: Bounds, additive: boolean) => void;
}

const GRID_SIZE = 10;

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
  onSaveHistory,
  onSelectByRect
}: StructuredCanvasRendererProps) => {

  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });

  const panRef = useRef<{
    active: boolean;
    startPos: Position;
    startPan: Position;
  }>({
    active: false,
    startPos: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 }
  });

  const drawStartRef = useRef<Position | null>(null);
  const [drawPreview, setDrawPreview] = useState<Bounds | null>(null);

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const getCanvasPosition = useCallback((e: MouseEvent | React.MouseEvent): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();

    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  // ================= MOUSE DOWN =================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {

    const pos = getCanvasPosition(e);

    // 🔥 Allow panning ONLY if hand tool active
    if (activeTool === 'hand') {
      panRef.current = {
        active: true,
        startPos: { x: e.clientX, y: e.clientY },
        startPan: { ...pan }
      };
      return;
    }

    if (activeTool === 'select') {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        onSelect(null, false);
      }
      return;
    }

    // Drawing
    drawStartRef.current = pos;
    onStartDrawing(pos);
    setDrawPreview({ x: pos.x, y: pos.y, width: 0, height: 0 });

  }, [activeTool, pan, getCanvasPosition, onSelect, onStartDrawing]);

  // ================= NATIVE MOVE LISTENER =================
  useEffect(() => {

    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {

      // 🔥 Pan only if hand tool
      if (panRef.current.active && activeTool === 'hand') {
        const dx = e.clientX - panRef.current.startPos.x;
        const dy = e.clientY - panRef.current.startPos.y;

        setPan({
          x: panRef.current.startPan.x + dx,
          y: panRef.current.startPan.y + dy
        });
        return;
      }

      const pos = getCanvasPosition(e);

      if (drawStartRef.current) {
        setDrawPreview({
          x: Math.min(drawStartRef.current.x, pos.x),
          y: Math.min(drawStartRef.current.y, pos.y),
          width: Math.abs(pos.x - drawStartRef.current.x),
          height: Math.abs(pos.y - drawStartRef.current.y)
        });

        onContinueDrawing(pos);
      }
    };

    const handleUp = (e: MouseEvent) => {

      if (panRef.current.active) {
        panRef.current.active = false;
        return;
      }

      if (drawStartRef.current) {
        const pos = getCanvasPosition(e);
        onStopDrawing(pos);
        drawStartRef.current = null;
        setDrawPreview(null);
      }
    };

    container.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      container.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

  }, [activeTool, getCanvasPosition, onContinueDrawing, onStopDrawing]);

  // ================= WHEEL HANDLER =================
  const handleWheel = useCallback((e: React.WheelEvent) => {

    // 🔥 Ignore scroll completely unless hand tool
    if (activeTool !== 'hand') return;

    e.preventDefault();
    e.stopPropagation();

    // Zoom with ctrl/cmd
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;

      setZoom(prev => {
        const newZoom = Math.min(3, Math.max(0.1, prev * delta));
        return newZoom;
      });

    } else {
      // Pan with wheel
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }

  }, [activeTool]);

  const getCursor = () => {
    if (panRef.current.active) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (activeTool === 'select') return 'default';
    return 'crosshair';
  };

  const sortedRootElements = rootIds
    .map(id => elements[id])
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-[hsl(var(--background))]"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onWheel={activeTool === 'hand' ? handleWheel : undefined}
    >

      {/* Grid */}
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

      {/* Canvas Transform */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {sortedRootElements.map(element => (
          <CanvasElementComponent
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            isHovered={hoveredId === element.id}
            onSelect={onSelect}
            zoom={zoom}
          />
        ))}

        {drawPreview && drawPreview.width > 0 && drawPreview.height > 0 && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
            style={{
              transform: `translate(${drawPreview.x}px, ${drawPreview.y}px)`,
              width: drawPreview.width,
              height: drawPreview.height
            }}
          />
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(0.1, prev * 0.8)); }}
          className="p-1 rounded hover:bg-accent/30"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs min-w-[3rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(3, prev * 1.25)); }}
          className="p-1 rounded hover:bg-accent/30"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border/50 mx-0.5" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1 rounded hover:bg-accent/30"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
});

StructuredCanvasRenderer.displayName = 'StructuredCanvasRenderer';

export default StructuredCanvasRenderer;
