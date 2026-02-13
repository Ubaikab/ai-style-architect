// Re-export all canvas types
export * from './elements';

// Legacy types for backward compatibility
export type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface DrawElement {
  id: string;
  type: Tool;
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
}

export interface CanvasState {
  elements: DrawElement[];
  currentElement: DrawElement | null;
  selectedTool: Tool;
  strokeColor: string;
  strokeWidth: number;
  history: DrawElement[][];
  historyIndex: number;
}

export interface TypographyFont {
  family: string;
  fallback: string;
  description: string;
}

export interface TypographyScale {
  size: string;
  weight: number;
  lineHeight: string;
  letterSpacing: string;
  usage: string;
}

export interface TypographyColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  background: string;
}

export interface ColorSwatch {
  hex: string;
  name: string;
  usage: string;
}

export interface ColorPalette {
  primary: ColorSwatch;
  secondary: ColorSwatch;
  accent: ColorSwatch;
  background: ColorSwatch;
  surface: ColorSwatch;
  text: ColorSwatch;
  muted: ColorSwatch;
  border: ColorSwatch;
  harmony: string;
  mood: string;
}

export interface TypographySystem {
  typography: {
    fonts: {
      heading: TypographyFont;
      body: TypographyFont;
      accent: TypographyFont;
    };
    scale: {
      h1: TypographyScale;
      h2: TypographyScale;
      h3: TypographyScale;
      h4: TypographyScale;
      body: TypographyScale;
      bodySmall: TypographyScale;
      caption: TypographyScale;
      button: TypographyScale;
    };
    colors: TypographyColors;
    aesthetic: string;
  };
  colorPalette?: ColorPalette;
}

// Chat message for design conversation
export interface DesignChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

// Generated visual UI (image-based)
export interface GeneratedUI {
  imageUrl: string;
  imageBase64: string;
  prompt: string;
  description: string;
  designNotes: string[];
  canvasPosition?: { x: number; y: number; width: number; height: number };
}

// Legacy code-based UI (kept for backward compatibility)
export interface GeneratedUICode {
  component: {
    name: string;
    jsx: string;
    description: string;
  };
  elements: Array<{
    type: string;
    description: string;
    tailwindClasses: string;
  }>;
}

export interface SavedDesign {
  id: string;
  user_id: string;
  name: string;
  sketch_data: DrawElement[] | null;
  typography_system: TypographySystem | null;
  color_palette: ColorPalette | null;
  generated_ui: GeneratedUI | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}
