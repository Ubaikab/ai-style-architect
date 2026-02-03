import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { 
  CanvasElement, 
  CanvasState, 
  Tool, 
  ElementType,
  ElementStyle,
  LayoutProperties,
  DEFAULT_ELEMENT_STYLES,
  DEFAULT_ELEMENT_SIZES,
  DEFAULT_LAYOUT
} from '@/types/canvas';

interface CanvasStore extends CanvasState {
  // Tool state
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  
  // Element CRUD
  addElement: (type: ElementType, x: number, y: number, parentId?: string | null) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => string | null;
  
  // Selection
  selectElement: (id: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  selectAll: () => void;
  
  // Hierarchy
  moveElement: (id: string, newParentId: string | null) => void;
  reorderElement: (id: string, direction: 'up' | 'down') => void;
  groupElements: (ids: string[]) => string | null;
  ungroupElement: (id: string) => void;
  
  // Canvas navigation
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  
  // Bulk operations
  clearCanvas: () => void;
  loadCanvas: (state: Partial<CanvasState>) => void;
  
  // Export
  exportToJSON: () => object;
  getStructuredLayout: () => object;
}

// Import defaults at runtime to avoid circular dependency issues
const getDefaults = async () => {
  const module = await import('@/types/canvas');
  return {
    styles: module.DEFAULT_ELEMENT_STYLES,
    sizes: module.DEFAULT_ELEMENT_SIZES,
    layout: module.DEFAULT_LAYOUT,
  };
};

// Sync defaults
import { 
  DEFAULT_ELEMENT_STYLES as STYLES, 
  DEFAULT_ELEMENT_SIZES as SIZES, 
  DEFAULT_LAYOUT as LAYOUT 
} from '@/types/canvas';

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  elements: {},
  selectedIds: [],
  rootElementIds: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  activeTool: 'select',
  
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  addElement: (type, x, y, parentId = null) => {
    const id = uuidv4();
    const defaults = SIZES[type];
    const style = STYLES[type];
    
    const newElement: CanvasElement = {
      id,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Object.keys(get().elements).length + 1}`,
      x,
      y,
      width: defaults.width,
      height: defaults.height,
      rotation: 0,
      style: { ...style },
      layout: ['frame', 'section', 'card'].includes(type) ? { ...LAYOUT } : undefined,
      parentId,
      childrenIds: [],
      locked: false,
      visible: true,
      text: type === 'text' ? 'Text' : type === 'button' ? 'Button' : undefined,
      placeholder: type === 'input' ? 'Enter text...' : undefined,
    };
    
    set((state) => {
      const newElements = { ...state.elements, [id]: newElement };
      let newRootIds = [...state.rootElementIds];
      
      if (parentId && state.elements[parentId]) {
        // Add to parent's children
        newElements[parentId] = {
          ...state.elements[parentId],
          childrenIds: [...state.elements[parentId].childrenIds, id],
        };
      } else {
        // Add to root
        newRootIds.push(id);
      }
      
      return {
        elements: newElements,
        rootElementIds: newRootIds,
        selectedIds: [id],
        activeTool: 'select',
      };
    });
    
    return id;
  },
  
  updateElement: (id, updates) => {
    set((state) => {
      if (!state.elements[id]) return state;
      return {
        elements: {
          ...state.elements,
          [id]: { ...state.elements[id], ...updates },
        },
      };
    });
  },
  
  deleteElement: (id) => {
    set((state) => {
      const element = state.elements[id];
      if (!element) return state;
      
      // Recursively collect all children to delete
      const idsToDelete = new Set<string>();
      const collectChildren = (elemId: string) => {
        idsToDelete.add(elemId);
        const elem = state.elements[elemId];
        elem?.childrenIds.forEach(collectChildren);
      };
      collectChildren(id);
      
      // Remove from parent's children
      const newElements = { ...state.elements };
      if (element.parentId && newElements[element.parentId]) {
        newElements[element.parentId] = {
          ...newElements[element.parentId],
          childrenIds: newElements[element.parentId].childrenIds.filter(
            (cid) => !idsToDelete.has(cid)
          ),
        };
      }
      
      // Delete all collected elements
      idsToDelete.forEach((delId) => delete newElements[delId]);
      
      return {
        elements: newElements,
        rootElementIds: state.rootElementIds.filter((rid) => !idsToDelete.has(rid)),
        selectedIds: state.selectedIds.filter((sid) => !idsToDelete.has(sid)),
      };
    });
  },
  
  duplicateElement: (id) => {
    const state = get();
    const element = state.elements[id];
    if (!element) return null;
    
    const newId = uuidv4();
    const duplicate: CanvasElement = {
      ...element,
      id: newId,
      name: `${element.name} Copy`,
      x: element.x + 20,
      y: element.y + 20,
      childrenIds: [],
    };
    
    set((s) => ({
      elements: { ...s.elements, [newId]: duplicate },
      rootElementIds: element.parentId ? s.rootElementIds : [...s.rootElementIds, newId],
      selectedIds: [newId],
    }));
    
    return newId;
  },
  
  selectElement: (id, addToSelection = false) => {
    set((state) => ({
      selectedIds: addToSelection 
        ? state.selectedIds.includes(id) 
          ? state.selectedIds.filter(sid => sid !== id)
          : [...state.selectedIds, id]
        : [id],
    }));
  },
  
  deselectAll: () => set({ selectedIds: [] }),
  
  selectAll: () => set((state) => ({ selectedIds: Object.keys(state.elements) })),
  
  moveElement: (id, newParentId) => {
    set((state) => {
      const element = state.elements[id];
      if (!element || element.parentId === newParentId) return state;
      
      const newElements = { ...state.elements };
      
      // Remove from old parent
      if (element.parentId && newElements[element.parentId]) {
        newElements[element.parentId] = {
          ...newElements[element.parentId],
          childrenIds: newElements[element.parentId].childrenIds.filter(cid => cid !== id),
        };
      }
      
      // Add to new parent
      if (newParentId && newElements[newParentId]) {
        newElements[newParentId] = {
          ...newElements[newParentId],
          childrenIds: [...newElements[newParentId].childrenIds, id],
        };
      }
      
      newElements[id] = { ...element, parentId: newParentId };
      
      let newRootIds = state.rootElementIds;
      if (!element.parentId && newParentId) {
        newRootIds = newRootIds.filter(rid => rid !== id);
      } else if (element.parentId && !newParentId) {
        newRootIds = [...newRootIds, id];
      }
      
      return { elements: newElements, rootElementIds: newRootIds };
    });
  },
  
  reorderElement: (id, direction) => {
    set((state) => {
      const element = state.elements[id];
      if (!element) return state;
      
      const siblingList = element.parentId 
        ? state.elements[element.parentId]?.childrenIds 
        : state.rootElementIds;
      
      if (!siblingList) return state;
      
      const currentIndex = siblingList.indexOf(id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= siblingList.length) return state;
      
      const newList = [...siblingList];
      [newList[currentIndex], newList[newIndex]] = [newList[newIndex], newList[currentIndex]];
      
      if (element.parentId) {
        return {
          elements: {
            ...state.elements,
            [element.parentId]: {
              ...state.elements[element.parentId],
              childrenIds: newList,
            },
          },
        };
      }
      
      return { rootElementIds: newList };
    });
  },
  
  groupElements: (ids) => {
    if (ids.length < 2) return null;
    
    const state = get();
    const elements = ids.map(id => state.elements[id]).filter(Boolean);
    if (elements.length < 2) return null;
    
    // Calculate bounding box
    const minX = Math.min(...elements.map(e => e.x));
    const minY = Math.min(...elements.map(e => e.y));
    const maxX = Math.max(...elements.map(e => e.x + e.width));
    const maxY = Math.max(...elements.map(e => e.y + e.height));
    
    const groupId = get().addElement('frame', minX - 16, minY - 16);
    
    // Update group size and move children
    set((s) => {
      const newElements = { ...s.elements };
      newElements[groupId] = {
        ...newElements[groupId],
        width: maxX - minX + 32,
        height: maxY - minY + 32,
        childrenIds: ids,
      };
      
      ids.forEach(id => {
        newElements[id] = {
          ...newElements[id],
          parentId: groupId,
          x: newElements[id].x - minX + 16,
          y: newElements[id].y - minY + 16,
        };
      });
      
      return {
        elements: newElements,
        rootElementIds: s.rootElementIds.filter(rid => !ids.includes(rid)),
        selectedIds: [groupId],
      };
    });
    
    return groupId;
  },
  
  ungroupElement: (id) => {
    set((state) => {
      const group = state.elements[id];
      if (!group || group.childrenIds.length === 0) return state;
      
      const newElements = { ...state.elements };
      const childIds = [...group.childrenIds];
      
      // Move children to root with absolute positions
      childIds.forEach(childId => {
        const child = newElements[childId];
        if (child) {
          newElements[childId] = {
            ...child,
            parentId: null,
            x: group.x + child.x,
            y: group.y + child.y,
          };
        }
      });
      
      // Delete the group
      delete newElements[id];
      
      return {
        elements: newElements,
        rootElementIds: [
          ...state.rootElementIds.filter(rid => rid !== id),
          ...childIds,
        ],
        selectedIds: childIds,
      };
    });
  },
  
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  
  setPan: (x, y) => set({ panX: x, panY: y }),
  
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
  
  clearCanvas: () => set({
    elements: {},
    selectedIds: [],
    rootElementIds: [],
    activeTool: 'select',
  }),
  
  loadCanvas: (newState) => set((state) => ({ ...state, ...newState })),
  
  exportToJSON: () => {
    const state = get();
    return {
      elements: state.elements,
      rootElementIds: state.rootElementIds,
    };
  },
  
  getStructuredLayout: () => {
    const state = get();
    
    const buildTree = (elementId: string): object => {
      const element = state.elements[elementId];
      if (!element) return {};
      
      return {
        type: element.type,
        name: element.name,
        dimensions: { width: element.width, height: element.height },
        style: element.style,
        layout: element.layout,
        text: element.text,
        placeholder: element.placeholder,
        children: element.childrenIds.map(buildTree),
      };
    };
    
    return {
      root: state.rootElementIds.map(buildTree),
      metadata: {
        elementCount: Object.keys(state.elements).length,
        exportedAt: new Date().toISOString(),
      },
    };
  },
}));
