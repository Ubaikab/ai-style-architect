import { useCanvasStore } from "@/stores/canvasStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
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
import { cn } from "@/lib/utils";
import type { ElementType } from "@/types/canvas";
import { useState } from "react";

const typeIcons: Record<ElementType, React.ReactNode> = {
  frame: <Square className="w-3.5 h-3.5" />,
  section: <LayoutGrid className="w-3.5 h-3.5" />,
  text: <Type className="w-3.5 h-3.5" />,
  button: <RectangleHorizontal className="w-3.5 h-3.5" />,
  input: <TextCursorInput className="w-3.5 h-3.5" />,
  card: <CreditCard className="w-3.5 h-3.5" />,
  image: <Image className="w-3.5 h-3.5" />,
  rectangle: <Shapes className="w-3.5 h-3.5" />,
  circle: <Circle className="w-3.5 h-3.5" />,
  line: <Minus className="w-3.5 h-3.5" />,
};

interface LayerItemProps {
  elementId: string;
  depth: number;
}

function LayerItem({ elementId, depth }: LayerItemProps) {
  const { elements, selectedIds, selectElement, updateElement } = useCanvasStore();
  const [expanded, setExpanded] = useState(true);
  
  const element = elements[elementId];
  if (!element) return null;

  const isSelected = selectedIds.includes(elementId);
  const hasChildren = element.childrenIds.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-accent/50 rounded transition-colors",
          isSelected && "bg-primary/20 text-primary"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={(e) => selectElement(elementId, e.shiftKey)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        
        <span className="text-muted-foreground">{typeIcons[element.type]}</span>
        
        <span className="flex-1 truncate text-xs">{element.name}</span>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateElement(elementId, { visible: !element.visible });
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {element.visible ? (
              <Eye className="w-3 h-3 text-muted-foreground" />
            ) : (
              <EyeOff className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateElement(elementId, { locked: !element.locked });
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {element.locked ? (
              <Lock className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Unlock className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div>
          {element.childrenIds.map((childId) => (
            <LayerItem key={childId} elementId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayersPanel() {
  const { rootElementIds, elements, clearCanvas } = useCanvasStore();

  return (
    <div className="w-56 glass-card border-r border-border/50 flex flex-col">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Layers</h3>
        <span className="text-xs text-muted-foreground">
          {Object.keys(elements).length} elements
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {rootElementIds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No elements yet. Click on the canvas to add elements.
            </p>
          ) : (
            <div className="space-y-0.5 group">
              {[...rootElementIds].reverse().map((elementId) => (
                <LayerItem key={elementId} elementId={elementId} depth={0} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {rootElementIds.length > 0 && (
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm('Clear all elements from canvas?')) {
                clearCanvas();
              }
            }}
          >
            Clear Canvas
          </Button>
        </div>
      )}
    </div>
  );
}
