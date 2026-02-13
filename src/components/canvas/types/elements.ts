// Figma-like structured element types for the canvas

export type ElementType = 
  | 'frame'
  | 'container'
  | 'auto-layout'
  | 'text'
  | 'button'
  | 'input'
  | 'image'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Position, Size {}

export interface Constraints {
  horizontal: 'left' | 'right' | 'center' | 'stretch' | 'scale';
  vertical: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BorderRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface Fill {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  opacity?: number;
  imageUrl?: string;
}

export interface Stroke {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
}

export interface AutoLayoutConfig {
  direction: 'horizontal' | 'vertical';
  gap: number;
  padding: Padding;
  alignItems: 'start' | 'center' | 'end' | 'stretch';
  justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  wrap: boolean;
}

// Base element interface
export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  bounds: Bounds;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  parentId: string | null;
  constraints: Constraints;
  zIndex: number;
}

// Frame element - container that clips content
export interface FrameElement extends BaseElement {
  type: 'frame';
  fill: Fill | null;
  stroke: Stroke | null;
  borderRadius: BorderRadius;
  clipContent: boolean;
  childIds: string[];
}

// Container element - like a div
export interface ContainerElement extends BaseElement {
  type: 'container';
  fill: Fill | null;
  stroke: Stroke | null;
  borderRadius: BorderRadius;
  padding: Padding;
  childIds: string[];
}

// Auto Layout element - flexbox-like container
export interface AutoLayoutElement extends BaseElement {
  type: 'auto-layout';
  fill: Fill | null;
  stroke: Stroke | null;
  borderRadius: BorderRadius;
  layout: AutoLayoutConfig;
  childIds: string[];
}

// Text element
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  textStyle: TextStyle;
  autoWidth: boolean;
  autoHeight: boolean;
}

// Button element
export interface ButtonElement extends BaseElement {
  type: 'button';
  label: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  fill: Fill | null;
  stroke: Stroke | null;
  borderRadius: BorderRadius;
  textStyle: TextStyle;
  padding: Padding;
}

// Input element
export interface InputElement extends BaseElement {
  type: 'input';
  placeholder: string;
  inputType: 'text' | 'email' | 'password' | 'number' | 'search';
  fill: Fill | null;
  stroke: Stroke | null;
  borderRadius: BorderRadius;
  textStyle: TextStyle;
  padding: Padding;
}

// Image element
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain' | 'fill' | 'none';
  borderRadius: BorderRadius;
}

// Rectangle shape
export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  fill: Fill | null;
  stroke: Stroke | null;
  borderRadius: BorderRadius;
  shadow: Shadow | null;
}

// Circle/Ellipse shape
export interface CircleElement extends BaseElement {
  type: 'circle';
  fill: Fill | null;
  stroke: Stroke | null;
  shadow: Shadow | null;
}

// Line element
export interface LineElement extends BaseElement {
  type: 'line';
  startPoint: Position;
  endPoint: Position;
  stroke: Stroke;
}

// Arrow element
export interface ArrowElement extends BaseElement {
  type: 'arrow';
  startPoint: Position;
  endPoint: Position;
  stroke: Stroke;
  arrowHead: 'start' | 'end' | 'both' | 'none';
}

// Union type for all elements
export type CanvasElement = 
  | FrameElement
  | ContainerElement
  | AutoLayoutElement
  | TextElement
  | ButtonElement
  | InputElement
  | ImageElement
  | RectangleElement
  | CircleElement
  | LineElement
  | ArrowElement;

// Canvas state
export interface StructuredCanvasState {
  elements: Record<string, CanvasElement>;
  rootIds: string[];
  selectedIds: string[];
  hoveredId: string | null;
  clipboard: CanvasElement[];
  history: {
    past: Record<string, CanvasElement>[];
    future: Record<string, CanvasElement>[];
  };
}

// Tool types for the structured canvas
export type StructuredTool = 
  | 'select'
  | 'frame'
  | 'container'
  | 'auto-layout-v'
  | 'auto-layout-h'
  | 'text'
  | 'button'
  | 'input'
  | 'image'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'hand';

// Snap guides for alignment
export interface SnapGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

// Selection box for multi-select
export interface SelectionBox {
  start: Position;
  end: Position;
}

// Resize handle positions
export type ResizeHandle = 
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';
