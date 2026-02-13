import {
  MousePointer,
  Pencil,
  Square,
  Circle,
  Minus,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2 } from
"lucide-react";
import { Tool } from "./types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger } from
"@/components/ui/tooltip";

interface ToolbarProps {
  selectedTool: Tool;
  strokeColor: string;
  strokeWidth: number;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: {tool: Tool;icon: typeof MousePointer;label: string;}[] = [
{ tool: 'select', icon: MousePointer, label: 'Select' },
{ tool: 'pen', icon: Pencil, label: 'Pen' },
{ tool: 'line', icon: Minus, label: 'Line' },
{ tool: 'rectangle', icon: Square, label: 'Rectangle' },
{ tool: 'circle', icon: Circle, label: 'Circle' },
{ tool: 'text', icon: Type, label: 'Text' },
{ tool: 'eraser', icon: Eraser, label: 'Eraser' }];


const colors = [
'#a855f7', // primary violet
'#ec4899', // pink
'#3b82f6', // blue
'#22c55e', // green
'#eab308', // yellow
'#f97316', // orange
'#ef4444', // red
'#ffffff' // white
];

const Toolbar = ({
  selectedTool,
  strokeColor,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo
}: ToolbarProps) => {
  return (
    <div className="flex items-center justify-between py-2">
      {/* Center: Tools */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
        {tools.map(({ tool, icon: Icon, label }) =>
        <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <button
              onClick={() => onToolChange(tool)}
              className={`p-2 rounded-md transition-all ${
              selectedTool === tool ?
              "bg-primary text-primary-foreground" :
              "hover:bg-accent/20 text-muted-foreground hover:text-foreground"}`
              }>

                <Icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Right: Colors, stroke, actions */}
      <div className="flex items-center gap-4">
        {/* Color picker */}
        <div className="hidden md:flex items-center gap-1">
          {colors.map((color) =>
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
            strokeColor === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`
            }
            style={{ backgroundColor: color }} />

          )}
        </div>

        {/* Stroke width */}
        <div className="hidden sm:flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            className="w-16 h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary" />

          <span className="text-xs text-muted-foreground w-4">{strokeWidth}</span>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8">

                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8">

                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-8 w-8 text-destructive hover:text-destructive">

                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>);

};

export default Toolbar;