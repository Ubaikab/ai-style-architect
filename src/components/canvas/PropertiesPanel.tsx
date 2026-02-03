import { useCanvasStore } from "@/stores/canvasStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LayoutDirection } from "@/types/canvas";

export function PropertiesPanel() {
  const { elements, selectedIds, updateElement, deleteElement, duplicateElement } = useCanvasStore();

  if (selectedIds.length === 0) {
    return (
      <div className="w-64 glass-card border-l border-border/50 p-4">
        <p className="text-sm text-muted-foreground text-center mt-8">
          Select an element to view its properties
        </p>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="w-64 glass-card border-l border-border/50 p-4">
        <p className="text-sm text-muted-foreground text-center mt-8">
          {selectedIds.length} elements selected
        </p>
        <div className="flex gap-2 mt-4 justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => selectedIds.forEach(id => deleteElement(id))}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete All
          </Button>
        </div>
      </div>
    );
  }

  const element = elements[selectedIds[0]];
  if (!element) return null;

  const updateStyle = (key: string, value: unknown) => {
    updateElement(element.id, {
      style: { ...element.style, [key]: value },
    });
  };

  const updateLayout = (key: string, value: unknown) => {
    if (!element.layout) return;
    updateElement(element.id, {
      layout: { ...element.layout, [key]: value },
    });
  };

  return (
    <div className="w-64 glass-card border-l border-border/50 flex flex-col">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">Properties</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Element Info */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={element.name}
              onChange={(e) => updateElement(element.id, { name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateElement(element.id, { locked: !element.locked })}
            >
              {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateElement(element.id, { visible: !element.visible })}
            >
              {element.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => duplicateElement(element.id)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => deleteElement(element.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          {/* Position & Size */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">X</Label>
                <Input
                  type="number"
                  value={Math.round(element.x)}
                  onChange={(e) => updateElement(element.id, { x: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Y</Label>
                <Input
                  type="number"
                  value={Math.round(element.y)}
                  onChange={(e) => updateElement(element.id, { y: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">W</Label>
                <Input
                  type="number"
                  value={Math.round(element.width)}
                  onChange={(e) => updateElement(element.id, { width: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">H</Label>
                <Input
                  type="number"
                  value={Math.round(element.height)}
                  onChange={(e) => updateElement(element.id, { height: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rotation</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[element.rotation]}
                onValueChange={([v]) => updateElement(element.id, { rotation: v })}
                min={0}
                max={360}
                step={1}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{Math.round(element.rotation)}°</span>
            </div>
          </div>

          <Separator />

          {/* Style */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">Style</Label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Fill</Label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={element.style.fill || '#000000'}
                    onChange={(e) => updateStyle('fill', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={element.style.fill || ''}
                    onChange={(e) => updateStyle('fill', e.target.value)}
                    placeholder="transparent"
                    className="h-7 text-xs flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Stroke</Label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={element.style.stroke || '#000000'}
                    onChange={(e) => updateStyle('stroke', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={element.style.stroke || ''}
                    onChange={(e) => updateStyle('stroke', e.target.value)}
                    placeholder="none"
                    className="h-7 text-xs flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">Corner Radius</Label>
              <Input
                type="number"
                value={element.style.cornerRadius || 0}
                onChange={(e) => updateStyle('cornerRadius', Number(e.target.value))}
                className="h-7 text-xs"
                min={0}
              />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">Opacity</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[element.style.opacity ?? 1]}
                  onValueChange={([v]) => updateStyle('opacity', v)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{Math.round((element.style.opacity ?? 1) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Text-specific properties */}
          {(element.type === 'text' || element.type === 'button') && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Text</Label>
                <Input
                  value={element.text || ''}
                  onChange={(e) => updateElement(element.id, { text: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Enter text..."
                />
                {element.type === 'text' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Font Size</Label>
                      <Input
                        type="number"
                        value={element.style.fontSize || 16}
                        onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                        className="h-7 text-xs"
                        min={8}
                        max={200}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Align</Label>
                      <Select
                        value={element.style.textAlign || 'left'}
                        onValueChange={(v) => updateStyle('textAlign', v)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Input-specific properties */}
          {element.type === 'input' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Placeholder</Label>
                <Input
                  value={element.placeholder || ''}
                  onChange={(e) => updateElement(element.id, { placeholder: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Enter placeholder..."
                />
              </div>
            </>
          )}

          {/* Layout properties for containers */}
          {element.layout && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Auto Layout</Label>

                <div>
                  <Label className="text-[10px] text-muted-foreground">Direction</Label>
                  <Select
                    value={element.layout.direction}
                    onValueChange={(v) => updateLayout('direction', v as LayoutDirection)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                      <SelectItem value="vertical">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">Gap</Label>
                  <Input
                    type="number"
                    value={element.layout.gap}
                    onChange={(e) => updateLayout('gap', Number(e.target.value))}
                    className="h-7 text-xs"
                    min={0}
                  />
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">Align Items</Label>
                  <Select
                    value={element.layout.alignItems}
                    onValueChange={(v) => updateLayout('alignItems', v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="end">End</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
