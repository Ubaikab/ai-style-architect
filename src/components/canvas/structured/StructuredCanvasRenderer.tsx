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
const SNAP_THRESHOLD = 8;

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

  // Ref-based drag state to avoid re-renders during drag
  const dragRef = useRef<{
    active: boolean;
    elementId: string | null;
    startPos: Position;
    lastPos: Position;
    accumDelta: Position;
    rafId: number | null;
  }>({ active: false, elementId: null, startPos: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 }, accumDelta: { x: 0, y: 0 }, rafId: null });

  const panRef = useRef<{
    active: boolean;
    startPos: Position;
    startPan: Position;
  }>({ active: false, startPos: { x: 0, y: 0 }, startPan: { x: 0, y: 0 } });

  const resizeRef = useRef<{
    active: boolean;
    elementId: string | null;
    handle: ResizeHandle | null;
    startPos: Position;
    startBounds: Bounds;
    rafId: number | null;
  }>({ active: false, elementId: null, handle: null, startPos: { x: 0, y: 0 }, startBounds: { x: 0, y: 0, width: 0, height: 0 }, rafId: null });

  const marqueeRef = useRef<{
    active: boolean;
    startPos: Position;
    currentPos: Position;
    additive: boolean;
  }>({ active: false, startPos: { x: 0, y: 0 }, currentPos: { x: 0, y: 0 }, additive: false });

  const [marqueeBox, setMarqueeBox] = useState<Bounds | null>(null);
  const [drawPreview, setDrawPreview] = useState<Bounds | null>(null);
  const drawStartRef = useRef<Position | null>(null);

  // For per-element drag offsets applied via refs
  const [dragOffsets, setDragOffsets] = useState<Record<string, Position>>({});

  const snapToGrid = useCallback((value: number): number => {
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

  // Find frame that contains a position (for clamping)
  const findParentFrame = useCallback((elementId: string): CanvasElementType | null => {
    const el = elements[elementId];
    if (!el) return null;
    // Check all frames to see if this element was placed inside one
    for (const id of rootIds) {
      const frame = elements[id];
      if (frame && frame.type === 'frame' && frame.id !== elementId) {
        if (el.bounds.x >= frame.bounds.x && el.bounds.y >= frame.bounds.y &&
            el.bounds.x + el.bounds.width <= frame.bounds.x + frame.bounds.width &&
            el.bounds.y + el.bounds.height <= frame.bounds.y + frame.bounds.height) {
          return frame;
        }
      }
    }
    return null;
  }, [elements, rootIds]);

  // Clamp bounds inside a frame
  const clampToFrame = useCallback((bounds: Bounds, frame: CanvasElementType): Bounds => {
    const fb = frame.bounds;
    return {
      x: Math.max(fb.x, Math.min(bounds.x, fb.x + fb.width - bounds.width)),
      y: Math.max(fb.y, Math.min(bounds.y, fb.y + fb.height - bounds.height)),
      width: Math.min(bounds.width, fb.width),
      height: Math.min(bounds.height, fb.height)
    };
  }, []);

  // Compute snap guides for an element being moved
  const computeSnapGuides = useCallback((movingId: string, movingBounds: Bounds): { guides: SnapGuide[]; snappedBounds: Bounds } => {
    const guides: SnapGuide[] = [];
    let snapped = { ...movingBounds };
    const edges = {
      left: snapped.x,
      right: snapped.x + snapped.width,
      centerX: snapped.x + snapped.width / 2,
      top: snapped.y,
      bottom: snapped.y + snapped.height,
      centerY: snapped.y + snapped.height / 2
    };

    for (const id of rootIds) {
      if (id === movingId || selectedIds.includes(id)) continue;
      const other = elements[id];
      if (!other) continue;
      const ob = other.bounds;
      const otherEdges = {
        left: ob.x,
        right: ob.x + ob.width,
        centerX: ob.x + ob.width / 2,
        top: ob.y,
        bottom: ob.y + ob.height,
        centerY: ob.y + ob.height / 2
      };

      // Vertical snaps (x-axis alignment)
      const vPairs: [number, number][] = [
        [edges.left, otherEdges.left],
        [edges.left, otherEdges.right],
        [edges.right, otherEdges.left],
        [edges.right, otherEdges.right],
        [edges.centerX, otherEdges.centerX],
      ];
      for (const [moving, target] of vPairs) {
        if (Math.abs(moving - target) < SNAP_THRESHOLD) {
          snapped.x += target - moving;
          guides.push({
            type: 'vertical',
            position: target,
            start: Math.min(snapped.y, ob.y),
            end: Math.max(snapped.y + snapped.height, ob.y + ob.height)
          });
          break;
        }
      }

      // Horizontal snaps (y-axis alignment)
      const hPairs: [number, number][] = [
        [edges.top, otherEdges.top],
        [edges.top, otherEdges.bottom],
        [edges.bottom, otherEdges.top],
        [edges.bottom, otherEdges.bottom],
        [edges.centerY, otherEdges.centerY],
      ];
      for (const [moving, target] of hPairs) {
        if (Math.abs(moving - target) < SNAP_THRESHOLD) {
          snapped.y += target - moving;
          guides.push({
            type: 'horizontal',
            position: target,
            start: Math.min(snapped.x, ob.x),
            end: Math.max(snapped.x + snapped.width, ob.x + ob.width)
          });
          break;
        }
      }
    }

    return { guides, snappedBounds: snapped };
  }, [elements, rootIds, selectedIds]);

  // ============ MOUSE DOWN ============
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);

    // Pan with hand tool, middle click, or alt+click
    if (activeTool === 'hand' || e.button === 1 || (e.button === 0 && e.altKey)) {
      panRef.current = { active: true, startPos: { x: e.clientX, y: e.clientY }, startPan: { ...pan } };
      return;
    }

    if (activeTool === 'select') {
      // Start marquee selection on empty canvas
      marqueeRef.current = {
        active: true,
        startPos: pos,
        currentPos: pos,
        additive: e.shiftKey || e.ctrlKey || e.metaKey
      };
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        onSelect(null, false);
      }
      return;
    }

    // Start drawing new element
    drawStartRef.current = pos;
    onStartDrawing(pos);
    setDrawPreview({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, [activeTool, pan, getCanvasPosition, onSelect, onStartDrawing]);

  // ============ MOUSE MOVE (native listener for performance) ============
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      // Panning
      if (panRef.current.active) {
        const dx = e.clientX - panRef.current.startPos.x;
        const dy = e.clientY - panRef.current.startPos.y;
        setPan({ x: panRef.current.startPan.x + dx, y: panRef.current.startPan.y + dy });
        return;
      }

      const pos = getCanvasPosition(e);

      // Dragging element(s)
      if (dragRef.current.active && dragRef.current.elementId) {
        const dx = pos.x - dragRef.current.lastPos.x;
        const dy = pos.y - dragRef.current.lastPos.y;
        dragRef.current.lastPos = pos;
        dragRef.current.accumDelta.x += dx;
        dragRef.current.accumDelta.y += dy;

        // Use rAF to batch DOM updates
        if (!dragRef.current.rafId) {
          dragRef.current.rafId = requestAnimationFrame(() => {
            dragRef.current.rafId = null;
            const delta = { ...dragRef.current.accumDelta };
            // Don't reset accum - we pass total offset to elements via dragOffsets
            // Actually, commit the move to state with snapped delta
            const el = elements[dragRef.current.elementId!];
            if (el) {
              const newBounds = {
                ...el.bounds,
                x: el.bounds.x + delta.x,
                y: el.bounds.y + delta.y,
                width: el.bounds.width,
                height: el.bounds.height
              };
              // Snap
              const { guides } = computeSnapGuides(dragRef.current.elementId!, newBounds);
              // We set guides directly
              // For now just move
            }
            onMove(dragRef.current.elementId!, { x: snapToGrid(delta.x), y: snapToGrid(delta.y) });
            dragRef.current.accumDelta = { x: 0, y: 0 };
          });
        }
        return;
      }

      // Resizing
      if (resizeRef.current.active && resizeRef.current.elementId && resizeRef.current.handle) {
        const dx = pos.x - resizeRef.current.startPos.x;
        const dy = pos.y - resizeRef.current.startPos.y;
        const sb = resizeRef.current.startBounds;
        let newBounds = { ...sb };

        switch (resizeRef.current.handle) {
          case 'top-left':
            newBounds.x = snapToGrid(sb.x + dx);
            newBounds.y = snapToGrid(sb.y + dy);
            newBounds.width = Math.max(20, sb.width - dx);
            newBounds.height = Math.max(20, sb.height - dy);
            break;
          case 'top':
            newBounds.y = snapToGrid(sb.y + dy);
            newBounds.height = Math.max(20, sb.height - dy);
            break;
          case 'top-right':
            newBounds.y = snapToGrid(sb.y + dy);
            newBounds.width = Math.max(20, sb.width + dx);
            newBounds.height = Math.max(20, sb.height - dy);
            break;
          case 'right':
            newBounds.width = Math.max(20, snapToGrid(sb.width + dx));
            break;
          case 'bottom-right':
            newBounds.width = Math.max(20, snapToGrid(sb.width + dx));
            newBounds.height = Math.max(20, snapToGrid(sb.height + dy));
            break;
          case 'bottom':
            newBounds.height = Math.max(20, snapToGrid(sb.height + dy));
            break;
          case 'bottom-left':
            newBounds.x = snapToGrid(sb.x + dx);
            newBounds.width = Math.max(20, sb.width - dx);
            newBounds.height = Math.max(20, snapToGrid(sb.height + dy));
            break;
          case 'left':
            newBounds.x = snapToGrid(sb.x + dx);
            newBounds.width = Math.max(20, sb.width - dx);
            break;
        }

        if (!resizeRef.current.rafId) {
          const bounds = newBounds;
          resizeRef.current.rafId = requestAnimationFrame(() => {
            resizeRef.current.rafId = null;
            onResize(resizeRef.current.elementId!, bounds);
          });
        }
        return;
      }

      // Marquee selection
      if (marqueeRef.current.active) {
        marqueeRef.current.currentPos = pos;
        const sx = Math.min(marqueeRef.current.startPos.x, pos.x);
        const sy = Math.min(marqueeRef.current.startPos.y, pos.y);
        const sw = Math.abs(pos.x - marqueeRef.current.startPos.x);
        const sh = Math.abs(pos.y - marqueeRef.current.startPos.y);
        setMarqueeBox({ x: sx, y: sy, width: sw, height: sh });
        return;
      }

      // Draw preview
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
      const pos = getCanvasPosition(e);

      if (panRef.current.active) {
        panRef.current.active = false;
        return;
      }

      if (dragRef.current.active) {
        if (dragRef.current.rafId) {
          cancelAnimationFrame(dragRef.current.rafId);
          // Flush final delta
          const delta = dragRef.current.accumDelta;
          if (delta.x !== 0 || delta.y !== 0) {
            onMove(dragRef.current.elementId!, { x: snapToGrid(delta.x), y: snapToGrid(delta.y) });
          }
        }
        dragRef.current = { active: false, elementId: null, startPos: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 }, accumDelta: { x: 0, y: 0 }, rafId: null };
        setDragOffsets({});
        return;
      }

      if (resizeRef.current.active) {
        if (resizeRef.current.rafId) cancelAnimationFrame(resizeRef.current.rafId);
        resizeRef.current = { active: false, elementId: null, handle: null, startPos: { x: 0, y: 0 }, startBounds: { x: 0, y: 0, width: 0, height: 0 }, rafId: null };
        return;
      }

      // End marquee
      if (marqueeRef.current.active) {
        marqueeRef.current.active = false;
        if (marqueeBox && marqueeBox.width > 5 && marqueeBox.height > 5) {
          // Select all elements intersecting the marquee
          const additive = marqueeRef.current.additive;
          rootIds.forEach(id => {
            const el = elements[id];
            if (!el) return;
            const b = el.bounds;
            const intersects = !(b.x + b.width < marqueeBox.x || b.x > marqueeBox.x + marqueeBox.width ||
              b.y + b.height < marqueeBox.y || b.y > marqueeBox.y + marqueeBox.height);
            if (intersects) {
              onSelect(id, true);
            }
          });
        }
        setMarqueeBox(null);
        return;
      }

      // End drawing
      if (drawStartRef.current) {
        onStopDrawing(pos);
        drawStartRef.current = null;
        setDrawPreview(null);
      }
    };

    // Use native listeners for performance
    container.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseup', handleUp);

    return () => {
      container.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [getCanvasPosition, onMove, onResize, onContinueDrawing, onStopDrawing, onSelect, elements, rootIds, snapToGrid, computeSnapGuides, marqueeBox, pan]);

  const handleStartDrag = useCallback((id: string, e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);
    onSaveHistory?.();
    dragRef.current = {
      active: true,
      elementId: id,
      startPos: pos,
      lastPos: pos,
      accumDelta: { x: 0, y: 0 },
      rafId: null
    };
  }, [getCanvasPosition, onSaveHistory]);

  const handleStartResize = useCallback((id: string, handle: ResizeHandle, e: React.MouseEvent) => {
    const element = elements[id];
    if (!element) return;
    const pos = getCanvasPosition(e);
    onSaveHistory?.();
    resizeRef.current = {
      active: true,
      elementId: id,
      handle,
      startPos: pos,
      startBounds: { ...element.bounds },
      rafId: null
    };
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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === ' ') e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCursor = () => {
    if (panRef.current.active || activeTool === 'hand') return 'grab';
    if (dragRef.current.active) return 'grabbing';
    if (activeTool === 'select') return 'default';
    return 'crosshair';
  };

  const sortedRootElements = rootIds
    .map(id => elements[id])
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex);

  // Compute combined bounding box for multi-selection
  const selectionBBox = selectedIds.length > 1 ? (() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of selectedIds) {
      const el = elements[id];
      if (!el) continue;
      minX = Math.min(minX, el.bounds.x);
      minY = Math.min(minY, el.bounds.y);
      maxX = Math.max(maxX, el.bounds.x + el.bounds.width);
      maxY = Math.max(maxY, el.bounds.y + el.bounds.height);
    }
    return minX < Infinity ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY } : null;
  })() : null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-[hsl(var(--background))]"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
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
        className="absolute origin-top-left will-change-transform"
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
              transform: `translate(${drawPreview.x}px, ${drawPreview.y}px)`,
              width: drawPreview.width,
              height: drawPreview.height
            }}
          />
        )}

        {/* Marquee selection box */}
        {marqueeBox && marqueeBox.width > 2 && marqueeBox.height > 2 && (
          <div
            className="absolute border border-primary/70 bg-primary/10 pointer-events-none"
            style={{
              transform: `translate(${marqueeBox.x}px, ${marqueeBox.y}px)`,
              width: marqueeBox.width,
              height: marqueeBox.height
            }}
          />
        )}

        {/* Combined bounding box for multi-selection */}
        {selectionBBox && (
          <div
            className="absolute border-2 border-dashed border-primary/50 pointer-events-none"
            style={{
              transform: `translate(${selectionBBox.x}px, ${selectionBBox.y}px)`,
              width: selectionBBox.width,
              height: selectionBBox.height
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
