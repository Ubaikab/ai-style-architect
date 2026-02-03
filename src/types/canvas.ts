// Canvas element types for structured wireframe data

export type ElementType = 
  | 'frame' 
  | 'section'
  | 'text' 
  | 'button' 
  | 'input' 
  | 'card' 
  | 'image'
  | 'rectangle'
  | 'circle'
  | 'line';

export type LayoutDirection = 'horizontal' | 'vertical' | 'none';

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface LayoutProperties {
  direction: LayoutDirection;
  gap: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alignItems: 'start' | 'center' | 'end' | 'stretch';
  justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  style: ElementStyle;
  layout?: LayoutProperties;
  parentId: string | null;
  childrenIds: string[];
  locked: boolean;
  visible: boolean;
  // Type-specific properties
  text?: string;
  placeholder?: string;
  src?: string;
  // Line-specific
  points?: number[];
}

export interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedIds: string[];
  rootElementIds: string[];
  zoom: number;
  panX: number;
  panY: number;
}

export type Tool = 
  | 'select'
  | 'frame'
  | 'section'
  | 'text'
  | 'button'
  | 'input'
  | 'card'
  | 'image'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'hand';

export interface ToolConfig {
  type: Tool;
  label: string;
  icon: string;
  shortcut?: string;
  category: 'layout' | 'ui' | 'shape' | 'navigation';
}

// Default element configurations
export const DEFAULT_ELEMENT_STYLES: Record<ElementType, Partial<ElementStyle>> = {
  frame: { fill: 'transparent', stroke: '#3b82f6', strokeWidth: 1, cornerRadius: 8 },
  section: { fill: 'rgba(59, 130, 246, 0.1)', stroke: '#3b82f6', strokeWidth: 1, cornerRadius: 4 },
  text: { fill: '#ffffff', fontSize: 16, fontWeight: '400' },
  button: { fill: '#6366f1', stroke: 'transparent', cornerRadius: 6 },
  input: { fill: '#1f2937', stroke: '#374151', strokeWidth: 1, cornerRadius: 6 },
  card: { fill: '#111827', stroke: '#1f2937', strokeWidth: 1, cornerRadius: 12 },
  image: { fill: '#374151', stroke: '#4b5563', strokeWidth: 1, cornerRadius: 4 },
  rectangle: { fill: '#6366f1', stroke: 'transparent', cornerRadius: 0 },
  circle: { fill: '#8b5cf6', stroke: 'transparent' },
  line: { stroke: '#9ca3af', strokeWidth: 2 },
};

export const DEFAULT_ELEMENT_SIZES: Record<ElementType, { width: number; height: number }> = {
  frame: { width: 320, height: 480 },
  section: { width: 280, height: 120 },
  text: { width: 200, height: 24 },
  button: { width: 120, height: 40 },
  input: { width: 240, height: 40 },
  card: { width: 280, height: 160 },
  image: { width: 200, height: 150 },
  rectangle: { width: 100, height: 100 },
  circle: { width: 80, height: 80 },
  line: { width: 100, height: 0 },
};

export const DEFAULT_LAYOUT: LayoutProperties = {
  direction: 'none',
  gap: 8,
  padding: { top: 16, right: 16, bottom: 16, left: 16 },
  alignItems: 'start',
  justifyContent: 'start',
};
