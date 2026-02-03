import { 
  MousePointer2, 
  Hand, 
  Square, 
  LayoutGrid, 
  Type, 
  RectangleHorizontal,
  TextCursorInput,
  CreditCard,
  Image,
  Circle,
  Minus,
  Shapes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useCanvasStore } from "@/stores/canvasStore";
import type { Tool } from "@/types/canvas";
import { cn } from "@/lib/utils";

interface ToolItem {
  tool: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const navigationTools: ToolItem[] = [
  { tool: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select', shortcut: 'V' },
  { tool: 'hand', icon: <Hand className="w-4 h-4" />, label: 'Hand', shortcut: 'H' },
];

const layoutTools: ToolItem[] = [
  { tool: 'frame', icon: <Square className="w-4 h-4" />, label: 'Frame', shortcut: 'F' },
  { tool: 'section', icon: <LayoutGrid className="w-4 h-4" />, label: 'Section', shortcut: 'S' },
];

const uiTools: ToolItem[] = [
  { tool: 'text', icon: <Type className="w-4 h-4" />, label: 'Text', shortcut: 'T' },
  { tool: 'button', icon: <RectangleHorizontal className="w-4 h-4" />, label: 'Button', shortcut: 'B' },
  { tool: 'input', icon: <TextCursorInput className="w-4 h-4" />, label: 'Input', shortcut: 'I' },
  { tool: 'card', icon: <CreditCard className="w-4 h-4" />, label: 'Card', shortcut: 'C' },
  { tool: 'image', icon: <Image className="w-4 h-4" />, label: 'Image' },
];

const shapeTools: ToolItem[] = [
  { tool: 'rectangle', icon: <Shapes className="w-4 h-4" />, label: 'Rectangle', shortcut: 'R' },
  { tool: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle', shortcut: 'O' },
  { tool: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line', shortcut: 'L' },
];

interface ToolButtonProps {
  item: ToolItem;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ item, isActive, onClick }: ToolButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-9 w-9 transition-colors",
              isActive && "bg-primary/20 text-primary hover:bg-primary/30"
            )}
            onClick={onClick}
          >
            {item.icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p className="font-medium">{item.label}</p>
          {item.shortcut && (
            <p className="text-xs text-muted-foreground">Press {item.shortcut}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ToolGroupProps {
  tools: ToolItem[];
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
}

function ToolGroup({ tools, activeTool, onSelect }: ToolGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      {tools.map((item) => (
        <ToolButton
          key={item.tool}
          item={item}
          isActive={activeTool === item.tool}
          onClick={() => onSelect(item.tool)}
        />
      ))}
    </div>
  );
}

export function CanvasToolbar() {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div className="flex flex-col gap-2 p-2 glass-card border-r border-border/50">
      <ToolGroup tools={navigationTools} activeTool={activeTool} onSelect={setActiveTool} />
      
      <Separator className="my-1" />
      
      <ToolGroup tools={layoutTools} activeTool={activeTool} onSelect={setActiveTool} />
      
      <Separator className="my-1" />
      
      <ToolGroup tools={uiTools} activeTool={activeTool} onSelect={setActiveTool} />
      
      <Separator className="my-1" />
      
      <ToolGroup tools={shapeTools} activeTool={activeTool} onSelect={setActiveTool} />
    </div>
  );
}
