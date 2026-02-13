import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  CanvasElement, 
  StructuredCanvasState, 
  StructuredTool,
  Position,
  Bounds,
  SnapGuide,
  SelectionBox,
  ResizeHandle,
  FrameElement,
  ContainerElement,
  AutoLayoutElement,
  TextElement,
  ButtonElement,
  InputElement,
  ImageElement,
  RectangleElement,
  CircleElement,
  LineElement,
  ArrowElement
} from '../types/elements';

const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const GRID_SIZE = 10;
const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

const STORAGE_KEY = 'design-studio-canvas';

const loadCanvasFromStorage = (): { elements: Record<string, CanvasElement>; rootIds: string[] } | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.elements && parsed.rootIds) return parsed;
    }
  } catch { /* ignore */ }
  return null;
};

const saveCanvasToStorage = (elements: Record<string, CanvasElement>, rootIds: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements, rootIds }));
  } catch { /* ignore */ }
};

// Default element factories
const createDefaultBounds = (x: number, y: number, width: number, height: number): Bounds => ({
  x, y, width, height
});

const createDefaultPadding = () => ({ top: 8, right: 8, bottom: 8, left: 8 });
const createDefaultBorderRadius = () => ({ topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 });
const createDefaultConstraints = () => ({ horizontal: 'left' as const, vertical: 'top' as const });

const createDefaultTextStyle = () => ({
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: 'left' as const,
  textDecoration: 'none' as const,
  color: '#ffffff'
});

export const useStructuredCanvas = () => {
  const [state, setState] = useState<StructuredCanvasState>(() => {
    const saved = loadCanvasFromStorage();
    return {
      elements: saved?.elements ?? {},
      rootIds: saved?.rootIds ?? [],
      selectedIds: [],
      hoveredId: null,
      clipboard: [],
      history: { past: [], future: [] }
    };
  });

  // Persist canvas to localStorage on every change
  useEffect(() => {
    saveCanvasToStorage(state.elements, state.rootIds);
  }, [state.elements, state.rootIds]);

  const [activeTool, setActiveTool] = useState<StructuredTool>('select');
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [dragOffset, setDragOffset] = useState<Position | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);

  const isDrawing = useRef(false);
  const drawStart = useRef<Position | null>(null);

  // Save to history before changes
  const saveToHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: {
        past: [...prev.history.past, prev.elements].slice(-50),
        future: []
      }
    }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.past.length === 0) return prev;
      const newPast = [...prev.history.past];
      const previousElements = newPast.pop()!;
      return {
        ...prev,
        elements: previousElements,
        rootIds: Object.values(previousElements).filter(el => !el.parentId).map(el => el.id),
        history: {
          past: newPast,
          future: [prev.elements, ...prev.history.future]
        }
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setState(prev => {
      if (prev.history.future.length === 0) return prev;
      const newFuture = [...prev.history.future];
      const nextElements = newFuture.shift()!;
      return {
        ...prev,
        elements: nextElements,
        rootIds: Object.values(nextElements).filter(el => !el.parentId).map(el => el.id),
        history: {
          past: [...prev.history.past, prev.elements],
          future: newFuture
        }
      };
    });
  }, []);

  // Get the next z-index
  const getNextZIndex = useCallback(() => {
    const elements = Object.values(state.elements);
    if (elements.length === 0) return 0;
    return Math.max(...elements.map(el => el.zIndex)) + 1;
  }, [state.elements]);

  // Create element based on tool
  const createElement = useCallback((tool: StructuredTool, bounds: Bounds): CanvasElement | null => {
    const baseElement = {
      id: generateId(),
      name: '',
      bounds,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      parentId: null,
      constraints: createDefaultConstraints(),
      zIndex: getNextZIndex()
    };

    switch (tool) {
      case 'frame':
        return {
          ...baseElement,
          type: 'frame',
          name: 'Frame',
          fill: { type: 'solid', color: '#1a1a2e', opacity: 1 },
          stroke: null,
          borderRadius: createDefaultBorderRadius(),
          clipContent: true,
          childIds: []
        } as FrameElement;

      case 'container':
        return {
          ...baseElement,
          type: 'container',
          name: 'Container',
          fill: null,
          stroke: { color: '#555555', width: 1, style: 'dashed' },
          borderRadius: createDefaultBorderRadius(),
          padding: createDefaultPadding(),
          childIds: []
        } as ContainerElement;

      case 'auto-layout-v':
        return {
          ...baseElement,
          type: 'auto-layout',
          name: 'V Stack',
          fill: null,
          stroke: null,
          borderRadius: createDefaultBorderRadius(),
          layout: {
            direction: 'vertical',
            gap: 8,
            padding: createDefaultPadding(),
            alignItems: 'stretch',
            justifyContent: 'start',
            wrap: false
          },
          childIds: []
        } as AutoLayoutElement;

      case 'auto-layout-h':
        return {
          ...baseElement,
          type: 'auto-layout',
          name: 'H Stack',
          fill: null,
          stroke: null,
          borderRadius: createDefaultBorderRadius(),
          layout: {
            direction: 'horizontal',
            gap: 8,
            padding: createDefaultPadding(),
            alignItems: 'center',
            justifyContent: 'start',
            wrap: false
          },
          childIds: []
        } as AutoLayoutElement;

      case 'text':
        return {
          ...baseElement,
          type: 'text',
          name: 'Text',
          content: 'Type something...',
          textStyle: createDefaultTextStyle(),
          autoWidth: true,
          autoHeight: true
        } as TextElement;

      case 'button':
        return {
          ...baseElement,
          type: 'button',
          name: 'Button',
          label: 'Button',
          variant: 'primary',
          fill: { type: 'solid', color: '#a855f7', opacity: 1 },
          stroke: null,
          borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
          textStyle: { ...createDefaultTextStyle(), fontWeight: 500 },
          padding: { top: 12, right: 24, bottom: 12, left: 24 }
        } as ButtonElement;

      case 'input':
        return {
          ...baseElement,
          type: 'input',
          name: 'Input',
          placeholder: 'Enter text...',
          inputType: 'text',
          fill: { type: 'solid', color: '#1a1a2e', opacity: 1 },
          stroke: { color: '#333333', width: 1, style: 'solid' },
          borderRadius: createDefaultBorderRadius(),
          textStyle: createDefaultTextStyle(),
          padding: { top: 10, right: 12, bottom: 10, left: 12 }
        } as InputElement;

      case 'image':
        return {
          ...baseElement,
          type: 'image',
          name: 'Image',
          src: '',
          alt: 'Image placeholder',
          objectFit: 'cover',
          borderRadius: createDefaultBorderRadius()
        } as ImageElement;

      case 'rectangle':
        return {
          ...baseElement,
          type: 'rectangle',
          name: 'Rectangle',
          fill: { type: 'solid', color: '#333333', opacity: 1 },
          stroke: null,
          borderRadius: createDefaultBorderRadius(),
          shadow: null
        } as RectangleElement;

      case 'circle':
        return {
          ...baseElement,
          type: 'circle',
          name: 'Circle',
          fill: { type: 'solid', color: '#333333', opacity: 1 },
          stroke: null,
          shadow: null
        } as CircleElement;

      case 'line':
        return {
          ...baseElement,
          type: 'line',
          name: 'Line',
          startPoint: { x: bounds.x, y: bounds.y },
          endPoint: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          stroke: { color: '#ffffff', width: 2, style: 'solid' }
        } as LineElement;

      case 'arrow':
        return {
          ...baseElement,
          type: 'arrow',
          name: 'Arrow',
          startPoint: { x: bounds.x, y: bounds.y },
          endPoint: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          stroke: { color: '#ffffff', width: 2, style: 'solid' },
          arrowHead: 'end'
        } as ArrowElement;

      default:
        return null;
    }
  }, [state.elements, getNextZIndex]);

  // Add element to canvas
  const addElement = useCallback((element: CanvasElement) => {
    saveToHistory();
    setState(prev => ({
      ...prev,
      elements: { ...prev.elements, [element.id]: element },
      rootIds: element.parentId ? prev.rootIds : [...prev.rootIds, element.id],
      selectedIds: [element.id]
    }));
  }, [saveToHistory]);

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setState(prev => {
      const element = prev.elements[id];
      if (!element) return prev;
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [id]: { ...element, ...updates } as CanvasElement
        }
      };
    });
  }, []);

  // Delete selected elements
  const deleteSelected = useCallback(() => {
    saveToHistory();
    setState(prev => {
      const newElements = { ...prev.elements };
      const newRootIds = [...prev.rootIds];
      
      prev.selectedIds.forEach(id => {
        delete newElements[id];
        const rootIndex = newRootIds.indexOf(id);
        if (rootIndex > -1) newRootIds.splice(rootIndex, 1);
      });

      return {
        ...prev,
        elements: newElements,
        rootIds: newRootIds,
        selectedIds: []
      };
    });
  }, [saveToHistory]);

  // Select element and bring to front
  const selectElement = useCallback((id: string | null, addToSelection = false) => {
    setState(prev => {
      if (id === null) {
        return { ...prev, selectedIds: [] };
      }

      if (addToSelection) {
        const isSelected = prev.selectedIds.includes(id);
        return {
          ...prev,
          selectedIds: isSelected
            ? prev.selectedIds.filter(sid => sid !== id)
            : [...prev.selectedIds, id]
        };
      }
      return { ...prev, selectedIds: [id] };
    });
  }, []);

  // Start drawing
  const startDrawing = useCallback((position: Position) => {
    if (activeTool === 'select' || activeTool === 'hand') return;
    
    isDrawing.current = true;
    drawStart.current = position;
  }, [activeTool]);

  // Continue drawing
  const continueDrawing = useCallback((position: Position) => {
    if (!isDrawing.current || !drawStart.current) return;
    // Could update preview here
  }, []);

  // Stop drawing and create element
  const stopDrawing = useCallback((position: Position) => {
    if (!isDrawing.current || !drawStart.current) return;
    
    isDrawing.current = false;
    
    const start = drawStart.current;
    const rawX = Math.min(start.x, position.x);
    const rawY = Math.min(start.y, position.y);
    const rawW = Math.abs(position.x - start.x) || 100;
    const rawH = Math.abs(position.y - start.y) || 40;
    const bounds = createDefaultBounds(
      snapToGrid(rawX),
      snapToGrid(rawY),
      snapToGrid(rawW) || 100,
      snapToGrid(rawH) || 40
    );

    const element = createElement(activeTool, bounds);
    if (element) {
      addElement(element);
    }

    drawStart.current = null;
    setActiveTool('select');
  }, [activeTool, createElement, addElement]);

  // Save history before drag starts
  const saveHistoryOnce = useCallback(() => {
    saveToHistory();
  }, [saveToHistory]);

  // Move element(s) - moves all selected elements together
  const moveElement = useCallback((id: string, delta: Position) => {
    setState(prev => {
      const element = prev.elements[id];
      if (!element || element.locked) return prev;

      // If the dragged element is selected, move all selected elements together
      const idsToMove = prev.selectedIds.includes(id) ? prev.selectedIds : [id];
      const updatedElements = { ...prev.elements };

      for (const moveId of idsToMove) {
        const el = updatedElements[moveId];
        if (!el || el.locked) continue;
        updatedElements[moveId] = {
          ...el,
          bounds: {
            ...el.bounds,
            x: snapToGrid(el.bounds.x + delta.x),
            y: snapToGrid(el.bounds.y + delta.y)
          }
        } as CanvasElement;
      }

      return { ...prev, elements: updatedElements };
    });
  }, []);

  // Resize element
  const resizeElement = useCallback((id: string, newBounds: Bounds) => {
    setState(prev => {
      const element = prev.elements[id];
      if (!element || element.locked) return prev;
      
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [id]: { ...element, bounds: {
            x: snapToGrid(newBounds.x),
            y: snapToGrid(newBounds.y),
            width: Math.max(20, snapToGrid(newBounds.width)),
            height: Math.max(20, snapToGrid(newBounds.height))
          }} as CanvasElement
        }
      };
    });
  }, []);

  // Bring element to front
  const bringToFront = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const maxZ = Math.max(...Object.values(prev.elements).map(el => el.zIndex), 0);
      const el = prev.elements[id];
      if (!el) return prev;
      return {
        ...prev,
        elements: { ...prev.elements, [id]: { ...el, zIndex: maxZ + 1 } as CanvasElement }
      };
    });
  }, [saveToHistory]);

  // Send element to back
  const sendToBack = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const minZ = Math.min(...Object.values(prev.elements).map(el => el.zIndex), 0);
      const el = prev.elements[id];
      if (!el) return prev;
      return {
        ...prev,
        elements: { ...prev.elements, [id]: { ...el, zIndex: minZ - 1 } as CanvasElement }
      };
    });
  }, [saveToHistory]);

  // Move element forward one layer
  const bringForward = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const el = prev.elements[id];
      if (!el) return prev;
      return {
        ...prev,
        elements: { ...prev.elements, [id]: { ...el, zIndex: el.zIndex + 1 } as CanvasElement }
      };
    });
  }, [saveToHistory]);

  // Move element backward one layer
  const sendBackward = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const el = prev.elements[id];
      if (!el) return prev;
      return {
        ...prev,
        elements: { ...prev.elements, [id]: { ...el, zIndex: el.zIndex - 1 } as CanvasElement }
      };
    });
  }, [saveToHistory]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    saveToHistory();
    setState(prev => ({
      ...prev,
      elements: {},
      rootIds: [],
      selectedIds: []
    }));
  }, [saveToHistory]);

  // Get elements as JSON for AI
  const exportAsJSON = useCallback(() => {
    return {
      elements: state.elements,
      rootIds: state.rootIds,
      version: '1.0'
    };
  }, [state.elements, state.rootIds]);

  // Import from JSON
  const importFromJSON = useCallback((json: { elements: Record<string, CanvasElement>; rootIds: string[] }) => {
    saveToHistory();
    setState(prev => ({
      ...prev,
      elements: json.elements,
      rootIds: json.rootIds,
      selectedIds: []
    }));
  }, [saveToHistory]);

  // Alignment helpers
  const alignElements = useCallback((axis: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (state.selectedIds.length < 2) return;
    saveToHistory();
    setState(prev => {
      const ids = prev.selectedIds;
      const els = ids.map(id => prev.elements[id]).filter(Boolean);
      if (els.length < 2) return prev;

      let ref: number;
      const updated = { ...prev.elements };

      switch (axis) {
        case 'left':
          ref = Math.min(...els.map(e => e.bounds.x));
          ids.forEach(id => { updated[id] = { ...updated[id], bounds: { ...updated[id].bounds, x: ref } } as CanvasElement; });
          break;
        case 'center-h': {
          const minX = Math.min(...els.map(e => e.bounds.x));
          const maxX = Math.max(...els.map(e => e.bounds.x + e.bounds.width));
          const center = (minX + maxX) / 2;
          ids.forEach(id => { updated[id] = { ...updated[id], bounds: { ...updated[id].bounds, x: center - updated[id].bounds.width / 2 } } as CanvasElement; });
          break;
        }
        case 'right':
          ref = Math.max(...els.map(e => e.bounds.x + e.bounds.width));
          ids.forEach(id => { updated[id] = { ...updated[id], bounds: { ...updated[id].bounds, x: ref - updated[id].bounds.width } } as CanvasElement; });
          break;
        case 'top':
          ref = Math.min(...els.map(e => e.bounds.y));
          ids.forEach(id => { updated[id] = { ...updated[id], bounds: { ...updated[id].bounds, y: ref } } as CanvasElement; });
          break;
        case 'center-v': {
          const minY = Math.min(...els.map(e => e.bounds.y));
          const maxY = Math.max(...els.map(e => e.bounds.y + e.bounds.height));
          const center = (minY + maxY) / 2;
          ids.forEach(id => { updated[id] = { ...updated[id], bounds: { ...updated[id].bounds, y: center - updated[id].bounds.height / 2 } } as CanvasElement; });
          break;
        }
        case 'bottom':
          ref = Math.max(...els.map(e => e.bounds.y + e.bounds.height));
          ids.forEach(id => { updated[id] = { ...updated[id], bounds: { ...updated[id].bounds, y: ref - updated[id].bounds.height } } as CanvasElement; });
          break;
      }
      return { ...prev, elements: updated };
    });
  }, [state.selectedIds, saveToHistory]);

  const distributeElements = useCallback((axis: 'horizontal' | 'vertical') => {
    if (state.selectedIds.length < 3) return;
    saveToHistory();
    setState(prev => {
      const ids = prev.selectedIds;
      const els = ids.map(id => prev.elements[id]).filter(Boolean);
      if (els.length < 3) return prev;

      const updated = { ...prev.elements };

      if (axis === 'horizontal') {
        const sorted = [...els].sort((a, b) => a.bounds.x - b.bounds.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last.bounds.x + last.bounds.width) - first.bounds.x;
        const totalWidth = sorted.reduce((s, e) => s + e.bounds.width, 0);
        const gap = (totalSpace - totalWidth) / (sorted.length - 1);
        let x = first.bounds.x;
        sorted.forEach(el => {
          updated[el.id] = { ...updated[el.id], bounds: { ...updated[el.id].bounds, x } } as CanvasElement;
          x += el.bounds.width + gap;
        });
      } else {
        const sorted = [...els].sort((a, b) => a.bounds.y - b.bounds.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last.bounds.y + last.bounds.height) - first.bounds.y;
        const totalHeight = sorted.reduce((s, e) => s + e.bounds.height, 0);
        const gap = (totalSpace - totalHeight) / (sorted.length - 1);
        let y = first.bounds.y;
        sorted.forEach(el => {
          updated[el.id] = { ...updated[el.id], bounds: { ...updated[el.id].bounds, y } } as CanvasElement;
          y += el.bounds.height + gap;
        });
      }
      return { ...prev, elements: updated };
    });
  }, [state.selectedIds, saveToHistory]);

  return {
    state,
    activeTool,
    setActiveTool,
    snapGuides,
    selectionBox,
    setSelectionBox,
    dragOffset,
    setDragOffset,
    resizeHandle,
    setResizeHandle,
    
    // Actions
    createElement,
    addElement,
    updateElement,
    deleteSelected,
    selectElement,
    moveElement,
    resizeElement,
    saveHistoryOnce,
    clearCanvas,
    undo,
    redo,
    
    // Layer controls
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    
    // Drawing
    startDrawing,
    continueDrawing,
    stopDrawing,
    
    // Serialization
    exportAsJSON,
    importFromJSON,

    // Alignment
    alignElements,
    distributeElements,
    
    // Helpers
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    selectedElements: state.selectedIds.map(id => state.elements[id]).filter(Boolean)
  };
};
