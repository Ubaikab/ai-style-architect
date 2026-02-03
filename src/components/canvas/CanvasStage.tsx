import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import type Konva from "konva";
import { useCanvasStore } from "@/stores/canvasStore";
import { CanvasElement } from "./CanvasElement";
import type { ElementType, Tool } from "@/types/canvas";

interface CanvasStageProps {
  width: number;
  height: number;
}

export function CanvasStage({ width, height }: CanvasStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  const {
    elements,
    rootElementIds,
    selectedIds,
    zoom,
    panX,
    panY,
    activeTool,
    addElement,
    updateElement,
    selectElement,
    deselectAll,
    setZoom,
    setPan,
    setActiveTool,
  } = useCanvasStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const shortcuts: Record<string, Tool> = {
        'v': 'select',
        'h': 'hand',
        'f': 'frame',
        's': 'section',
        't': 'text',
        'b': 'button',
        'i': 'input',
        'c': 'card',
        'r': 'rectangle',
        'o': 'circle',
        'l': 'line',
      };

      if (shortcuts[e.key.toLowerCase()]) {
        setActiveTool(shortcuts[e.key.toLowerCase()]);
      }

      // Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        selectedIds.forEach(id => useCanvasStore.getState().deleteElement(id));
      }

      // Deselect all with Escape
      if (e.key === 'Escape') {
        deselectAll();
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deselectAll, setActiveTool]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const selectedNodes = selectedIds
      .map(id => stageRef.current?.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds]);

  const drawingTools: ElementType[] = ['frame', 'section', 'text', 'button', 'input', 'card', 'image', 'rectangle', 'circle', 'line'];

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Clicked on empty area
    if (e.target === e.target.getStage()) {
      if (activeTool === 'select') {
        deselectAll();
        return;
      }

      // Start drawing new element
      if (drawingTools.includes(activeTool as ElementType)) {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          const adjustedPos = {
            x: (pos.x - panX) / zoom,
            y: (pos.y - panY) / zoom,
          };
          setDrawStart(adjustedPos);
          setIsDrawing(true);
        }
      }
    }
  }, [activeTool, deselectAll, panX, panY, zoom, drawingTools]);

  const handleStageMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    const drawingTools: ElementType[] = ['frame', 'section', 'text', 'button', 'input', 'card', 'image', 'rectangle', 'circle', 'line'];
    
    if (pos && drawingTools.includes(activeTool as ElementType)) {
      // Add element at click position
      addElement(activeTool as ElementType, drawStart.x, drawStart.y);
    }

    setIsDrawing(false);
  }, [isDrawing, activeTool, addElement, drawStart]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom
      const scaleBy = 1.1;
      const stage = e.target.getStage();
      const oldZoom = zoom;
      const pointer = stage?.getPointerPosition();

      if (!pointer) return;

      const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
      setZoom(newZoom);

      // Adjust pan to zoom towards pointer
      const mousePointTo = {
        x: (pointer.x - panX) / oldZoom,
        y: (pointer.y - panY) / oldZoom,
      };

      const newPanX = pointer.x - mousePointTo.x * newZoom;
      const newPanY = pointer.y - mousePointTo.y * newZoom;
      setPan(newPanX, newPanY);
    } else {
      // Pan
      setPan(panX - e.evt.deltaX, panY - e.evt.deltaY);
    }
  }, [zoom, panX, panY, setZoom, setPan]);

  const handleDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [updateElement]);

  const handleTransformEnd = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Node;
    updateElement(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, node.width() * node.scaleX()),
      height: Math.max(10, node.height() * node.scaleY()),
      rotation: node.rotation(),
    });
    // Reset scale
    node.scaleX(1);
    node.scaleY(1);
  }, [updateElement]);

  const renderElement = (elementId: string) => {
    const element = elements[elementId];
    if (!element || !element.visible) return null;

    return (
      <CanvasElement
        key={element.id}
        element={element}
        isSelected={selectedIds.includes(element.id)}
        onSelect={(e) => {
          e.cancelBubble = true;
          selectElement(element.id, e.evt.shiftKey);
        }}
        onDragEnd={(e) => handleDragEnd(element.id, e)}
        onTransformEnd={(e) => handleTransformEnd(element.id, e)}
      >
        {element.childrenIds.map(renderElement)}
      </CanvasElement>
    );
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={panX}
      y={panY}
      onMouseDown={handleStageMouseDown}
      onMouseUp={handleStageMouseUp}
      onWheel={handleWheel}
      style={{ 
        cursor: activeTool === 'hand' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair',
        background: 'hsl(var(--background))',
      }}
    >
      <Layer>
        {/* Grid pattern would go here */}
        {rootElementIds.map(renderElement)}
        
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraint
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          anchorFill="#6366f1"
          anchorStroke="#4f46e5"
          borderStroke="#6366f1"
          anchorSize={8}
          rotateEnabled={true}
          keepRatio={false}
        />
      </Layer>
    </Stage>
  );
}
