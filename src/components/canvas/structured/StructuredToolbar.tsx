import { 
  MousePointer, 
  Frame,
  LayoutGrid,
  AlignVerticalJustifyStart,
  AlignHorizontalJustifyStart,
  Type,
  Square as SquareIcon,
  Circle,
  Minus,
  MoveRight,
  FormInput,
  ImageIcon,
  Hand,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Clipboard
} from "lucide-react";
import { StructuredTool } from "../types/elements";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface StructuredToolbarProps {
  activeTool: StructuredTool;
  onToolChange: (tool: StructuredTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

const toolGroups: { 
  label: string; 
  tools: { tool: StructuredTool; icon: typeof MousePointer; label: string }[] 
}[] = [
  {
    label: 'Selection',
    tools: [
      { tool: 'select', icon: MousePointer, label: 'Select (V)' },
      { tool: 'hand', icon: Hand, label: 'Hand (H)' },
    ]
  },
  {
    label: 'Layout',
    tools: [
      { tool: 'frame', icon: Frame, label: 'Frame (F)' },
      { tool: 'container', icon: LayoutGrid, label: 'Container' },
    ]
  },
  {
    label: 'Components',
    tools: [
      { tool: 'text', icon: Type, label: 'Text (T)' },
      { tool: 'button', icon: SquareIcon, label: 'Button' },
      { tool: 'input', icon: FormInput, label: 'Input' },
      { tool: 'image', icon: ImageIcon, label: 'Image' },
    ]
  },
  {
    label: 'Shapes',
    tools: [
      { tool: 'rectangle', icon: SquareIcon, label: 'Rectangle (R)' },
      { tool: 'circle', icon: Circle, label: 'Circle (O)' },
      { tool: 'line', icon: Minus, label: 'Line (L)' },
      { tool: 'arrow', icon: MoveRight, label: 'Arrow' },
    ]
  }
];

const StructuredToolbar = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  canUndo,
  canRedo,
  hasSelection,
}: StructuredToolbarProps) => {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-border/50 bg-card/50 overflow-x-auto">
      {toolGroups.map((group, groupIndex) => (
        <div key={group.label} className="flex items-center">
          {groupIndex > 0 && <Separator orientation="vertical" className="h-6 mx-1" />}
          <div className="flex items-center gap-0.5">
            {group.tools.map(({ tool, icon: Icon, label }) => (
              <Tooltip key={tool}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToolChange(tool)}
                    className={`p-2 rounded-md transition-all ${
                      activeTool === tool
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopy}
              disabled={!hasSelection}
              className="h-8 w-8"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Copy (Ctrl+C)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPaste}
              className="h-8 w-8"
            >
              <Clipboard className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Paste (Ctrl+V)</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={!hasSelection}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Delete (Del)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default StructuredToolbar;
