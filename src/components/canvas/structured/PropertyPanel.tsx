import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  CanvasElement,
  TextElement,
  ButtonElement,
  InputElement,
  RectangleElement,
  FrameElement,
  ContainerElement,
  AutoLayoutElement
} from '../types/elements';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Unlock, Eye, EyeOff, ArrowUpToLine, ArrowDownToLine, ChevronUp, ChevronDown, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, GripHorizontal, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PropertyPanelProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
  onAlignElements?: (axis: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  onDistributeElements?: (axis: 'horizontal' | 'vertical') => void;
}

const PropertyPanel = memo(({ selectedElements, onUpdateElement, onBringToFront, onSendToBack, onBringForward, onSendBackward, onAlignElements, onDistributeElements }: PropertyPanelProps) => {
  if (selectedElements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center">
        <div>
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          {selectedElements.length} elements selected
        </p>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs">Align</Label>
          <div className="grid grid-cols-3 gap-1">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onAlignElements?.('left')}>
                <AlignStartVertical className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Align Left</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onAlignElements?.('center-h')}>
                <AlignCenterVertical className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Align Center H</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onAlignElements?.('right')}>
                <AlignEndVertical className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Align Right</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onAlignElements?.('top')}>
                <AlignStartHorizontal className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Align Top</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onAlignElements?.('center-v')}>
                <AlignCenterHorizontal className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Align Center V</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onAlignElements?.('bottom')}>
                <AlignEndHorizontal className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Align Bottom</p></TooltipContent></Tooltip>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Distribute (3+ elements)</Label>
          <div className="grid grid-cols-2 gap-1">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8" disabled={selectedElements.length < 3} onClick={() => onDistributeElements?.('horizontal')}>
                <GripHorizontal className="w-3.5 h-3.5 mr-1" /> H
              </Button>
            </TooltipTrigger><TooltipContent><p>Distribute Horizontally</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8" disabled={selectedElements.length < 3} onClick={() => onDistributeElements?.('vertical')}>
                <GripVertical className="w-3.5 h-3.5 mr-1" /> V
              </Button>
            </TooltipTrigger><TooltipContent><p>Distribute Vertically</p></TooltipContent></Tooltip>
          </div>
        </div>
      </div>
    );
  }

  const element = selectedElements[0];

  const updateBounds = (key: 'x' | 'y' | 'width' | 'height', value: number) => {
    onUpdateElement(element.id, {
      bounds: { ...element.bounds, [key]: value }
    } as Partial<CanvasElement>);
  };

  const renderCommonProperties = () => (
    <>
      {/* Name */}
      <div className="space-y-2">
        <Label className="text-xs">Name</Label>
        <Input
          value={element.name}
          onChange={(e) => onUpdateElement(element.id, { name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Position & Size */}
      <div className="space-y-2">
        <Label className="text-xs">Position</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">X</span>
            <Input
              type="number"
              value={Math.round(element.bounds.x)}
              onChange={(e) => updateBounds('x', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Y</span>
            <Input
              type="number"
              value={Math.round(element.bounds.y)}
              onChange={(e) => updateBounds('y', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">W</span>
            <Input
              type="number"
              value={Math.round(element.bounds.width)}
              onChange={(e) => updateBounds('width', parseFloat(e.target.value) || 20)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">H</span>
            <Input
              type="number"
              value={Math.round(element.bounds.height)}
              onChange={(e) => updateBounds('height', parseFloat(e.target.value) || 20)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Opacity</Label>
          <span className="text-xs text-muted-foreground">{Math.round(element.opacity * 100)}%</span>
        </div>
        <Slider
          value={[element.opacity * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => onUpdateElement(element.id, { opacity: v / 100 })}
        />
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Rotation</Label>
          <span className="text-xs text-muted-foreground">{element.rotation}°</span>
        </div>
        <Slider
          value={[element.rotation]}
          min={0}
          max={360}
          step={1}
          onValueChange={([v]) => onUpdateElement(element.id, { rotation: v })}
        />
      </div>

      {/* Lock & Visibility */}
      <div className="flex items-center gap-2">
        <Button
          variant={element.locked ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => onUpdateElement(element.id, { locked: !element.locked })}
        >
          {element.locked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
          {element.locked ? 'Locked' : 'Unlocked'}
        </Button>
        <Button
          variant={element.visible ? 'ghost' : 'secondary'}
          size="sm"
          className="flex-1"
          onClick={() => onUpdateElement(element.id, { visible: !element.visible })}
        >
          {element.visible ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          {element.visible ? 'Visible' : 'Hidden'}
        </Button>
      </div>

      {/* Layer Order */}
      <div className="space-y-2">
        <Label className="text-xs">Layer Order</Label>
        <div className="grid grid-cols-4 gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onBringToFront?.(element.id)}>
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Bring to Front</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onBringForward?.(element.id)}>
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Bring Forward</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onSendBackward?.(element.id)}>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Send Backward</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-0" onClick={() => onSendToBack?.(element.id)}>
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Send to Back</p></TooltipContent>
          </Tooltip>
        </div>
        <span className="text-xs text-muted-foreground">Z-Index: {element.zIndex}</span>
      </div>
    </>
  );

  const renderTextProperties = () => {
    const textEl = element as TextElement;
    return (
      <>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs">Content</Label>
          <Input
            value={textEl.content}
            onChange={(e) => onUpdateElement(element.id, { content: e.target.value } as Partial<TextElement>)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Font Size</Label>
          <Input
            type="number"
            value={textEl.textStyle.fontSize}
            onChange={(e) => onUpdateElement(element.id, { 
              textStyle: { ...textEl.textStyle, fontSize: parseFloat(e.target.value) || 16 }
            } as Partial<TextElement>)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Font Weight</Label>
          <Select 
            value={String(textEl.textStyle.fontWeight)}
            onValueChange={(v) => onUpdateElement(element.id, {
              textStyle: { ...textEl.textStyle, fontWeight: parseInt(v) }
            } as Partial<TextElement>)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Light</SelectItem>
              <SelectItem value="400">Regular</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semibold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={textEl.textStyle.color}
              onChange={(e) => onUpdateElement(element.id, {
                textStyle: { ...textEl.textStyle, color: e.target.value }
              } as Partial<TextElement>)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={textEl.textStyle.color}
              onChange={(e) => onUpdateElement(element.id, {
                textStyle: { ...textEl.textStyle, color: e.target.value }
              } as Partial<TextElement>)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      </>
    );
  };

  const renderButtonProperties = () => {
    const btnEl = element as ButtonElement;
    return (
      <>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs">Label</Label>
          <Input
            value={btnEl.label}
            onChange={(e) => onUpdateElement(element.id, { label: e.target.value } as Partial<ButtonElement>)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Font Size</Label>
          <Input
            type="number"
            value={btnEl.textStyle.fontSize}
            onChange={(e) => onUpdateElement(element.id, {
              textStyle: { ...btnEl.textStyle, fontSize: parseFloat(e.target.value) || 14 }
            } as Partial<ButtonElement>)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Font Weight</Label>
          <Select 
            value={String(btnEl.textStyle.fontWeight)}
            onValueChange={(v) => onUpdateElement(element.id, {
              textStyle: { ...btnEl.textStyle, fontWeight: parseInt(v) }
            } as Partial<ButtonElement>)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Light</SelectItem>
              <SelectItem value="400">Regular</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semibold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Text Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={btnEl.textStyle.color}
              onChange={(e) => onUpdateElement(element.id, {
                textStyle: { ...btnEl.textStyle, color: e.target.value }
              } as Partial<ButtonElement>)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={btnEl.textStyle.color}
              onChange={(e) => onUpdateElement(element.id, {
                textStyle: { ...btnEl.textStyle, color: e.target.value }
              } as Partial<ButtonElement>)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Variant</Label>
          <Select 
            value={btnEl.variant}
            onValueChange={(v) => onUpdateElement(element.id, { variant: v } as Partial<ButtonElement>)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Background</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={btnEl.fill?.color || '#a855f7'}
              onChange={(e) => onUpdateElement(element.id, {
                fill: { type: 'solid', color: e.target.value, opacity: 1 }
              } as Partial<ButtonElement>)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={btnEl.fill?.color || '#a855f7'}
              onChange={(e) => onUpdateElement(element.id, {
                fill: { type: 'solid', color: e.target.value, opacity: 1 }
              } as Partial<ButtonElement>)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      </>
    );
  };

  const renderFillProperties = () => {
    const fillEl = element as RectangleElement | FrameElement | ContainerElement;
    if (!('fill' in element)) return null;
    
    return (
      <>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs">Fill</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={fillEl.fill?.color || '#333333'}
              onChange={(e) => onUpdateElement(element.id, {
                fill: { type: 'solid', color: e.target.value, opacity: 1 }
              } as Partial<RectangleElement>)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={fillEl.fill?.color || '#333333'}
              onChange={(e) => onUpdateElement(element.id, {
                fill: { type: 'solid', color: e.target.value, opacity: 1 }
              } as Partial<RectangleElement>)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      </>
    );
  };

  const renderAutoLayoutProperties = () => {
    const layoutEl = element as AutoLayoutElement;
    return (
      <>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs">Direction</Label>
          <Select 
            value={layoutEl.layout.direction}
            onValueChange={(v) => onUpdateElement(element.id, {
              layout: { ...layoutEl.layout, direction: v as 'horizontal' | 'vertical' }
            } as Partial<AutoLayoutElement>)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Gap</Label>
            <span className="text-xs text-muted-foreground">{layoutEl.layout.gap}px</span>
          </div>
          <Slider
            value={[layoutEl.layout.gap]}
            min={0}
            max={48}
            step={4}
            onValueChange={([v]) => onUpdateElement(element.id, {
              layout: { ...layoutEl.layout, gap: v }
            } as Partial<AutoLayoutElement>)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Align Items</Label>
          <Select 
            value={layoutEl.layout.alignItems}
            onValueChange={(v) => onUpdateElement(element.id, {
              layout: { ...layoutEl.layout, alignItems: v as 'start' | 'center' | 'end' | 'stretch' }
            } as Partial<AutoLayoutElement>)}
          >
            <SelectTrigger className="h-8 text-sm">
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
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full overflow-y-auto p-4 space-y-4"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {element.type}
        </span>
      </div>

      {renderCommonProperties()}

      {element.type === 'text' && renderTextProperties()}
      {element.type === 'button' && renderButtonProperties()}
      {element.type === 'auto-layout' && renderAutoLayoutProperties()}
      {['rectangle', 'circle', 'frame', 'container'].includes(element.type) && renderFillProperties()}
    </motion.div>
  );
});

PropertyPanel.displayName = 'PropertyPanel';

export default PropertyPanel;
