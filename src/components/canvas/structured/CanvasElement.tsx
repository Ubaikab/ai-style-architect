import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CanvasElement as CanvasElementType,
  FrameElement,
  ContainerElement,
  AutoLayoutElement,
  TextElement,
  ButtonElement,
  InputElement,
  ImageElement,
  RectangleElement,
  CircleElement,
  LineElement,
  ArrowElement,
  ResizeHandle
} from '../types/elements';

interface CanvasElementProps {
  element: CanvasElementType;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onStartDrag: (id: string, e: React.MouseEvent) => void;
  onStartResize: (id: string, handle: ResizeHandle, e: React.MouseEvent) => void;
  zoom: number;
}

const resizeHandles: ResizeHandle[] = [
  'top-left', 'top', 'top-right', 
  'right', 
  'bottom-right', 'bottom', 'bottom-left',
  'left'
];

const getHandlePosition = (handle: ResizeHandle): React.CSSProperties => {
  const positions: Record<ResizeHandle, React.CSSProperties> = {
    'top-left': { top: -4, left: -4, cursor: 'nwse-resize' },
    'top': { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    'top-right': { top: -4, right: -4, cursor: 'nesw-resize' },
    'right': { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    'bottom-right': { bottom: -4, right: -4, cursor: 'nwse-resize' },
    'bottom': { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    'bottom-left': { bottom: -4, left: -4, cursor: 'nesw-resize' },
    'left': { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' }
  };
  return positions[handle];
};

const getBorderRadiusCSS = (br: { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number }) => 
  `${br.topLeft}px ${br.topRight}px ${br.bottomRight}px ${br.bottomLeft}px`;

const CanvasElementComponent = memo(({
  element,
  isSelected,
  isHovered,
  onSelect,
  onStartDrag,
  onStartResize,
  zoom
}: CanvasElementProps) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id, e.shiftKey);
    if (!element.locked) {
      onStartDrag(element.id, e);
    }
  }, [element.id, element.locked, onSelect, onStartDrag]);

  const handleResizeMouseDown = useCallback((handle: ResizeHandle, e: React.MouseEvent) => {
    e.stopPropagation();
    onStartResize(element.id, handle, e);
  }, [element.id, onStartResize]);

  const renderContent = () => {
    switch (element.type) {
      case 'frame':
      case 'container': {
        const el = element as FrameElement | ContainerElement;
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: el.fill?.color || 'transparent',
              opacity: el.fill?.opacity ?? 1,
              border: el.stroke ? `${el.stroke.width}px ${el.stroke.style} ${el.stroke.color}` : 'none',
              borderRadius: getBorderRadiusCSS(el.borderRadius)
            }}
          />
        );
      }

      case 'auto-layout': {
        const el = element as AutoLayoutElement;
        return (
          <div
            className="w-full h-full flex"
            style={{
              backgroundColor: el.fill?.color || 'transparent',
              borderRadius: getBorderRadiusCSS(el.borderRadius),
              flexDirection: el.layout.direction === 'horizontal' ? 'row' : 'column',
              gap: el.layout.gap,
              padding: `${el.layout.padding.top}px ${el.layout.padding.right}px ${el.layout.padding.bottom}px ${el.layout.padding.left}px`,
              alignItems: el.layout.alignItems,
              justifyContent: el.layout.justifyContent
            }}
          />
        );
      }

      case 'text': {
        const el = element as TextElement;
        return (
          <div
            className="w-full h-full flex items-center"
            style={{
              fontFamily: el.textStyle.fontFamily,
              fontSize: el.textStyle.fontSize,
              fontWeight: el.textStyle.fontWeight,
              lineHeight: el.textStyle.lineHeight,
              letterSpacing: el.textStyle.letterSpacing,
              textAlign: el.textStyle.textAlign,
              color: el.textStyle.color,
              textDecoration: el.textStyle.textDecoration
            }}
          >
            {el.content}
          </div>
        );
      }

      case 'button': {
        const el = element as ButtonElement;
        return (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: el.fill?.color || 'transparent',
              border: el.stroke ? `${el.stroke.width}px ${el.stroke.style} ${el.stroke.color}` : 'none',
              borderRadius: getBorderRadiusCSS(el.borderRadius),
              fontFamily: el.textStyle.fontFamily,
              fontSize: el.textStyle.fontSize,
              fontWeight: el.textStyle.fontWeight,
              color: el.textStyle.color,
              padding: `${el.padding.top}px ${el.padding.right}px ${el.padding.bottom}px ${el.padding.left}px`
            }}
          >
            {el.label}
          </div>
        );
      }

      case 'input': {
        const el = element as InputElement;
        return (
          <div
            className="w-full h-full flex items-center"
            style={{
              backgroundColor: el.fill?.color || 'transparent',
              border: el.stroke ? `${el.stroke.width}px ${el.stroke.style} ${el.stroke.color}` : 'none',
              borderRadius: getBorderRadiusCSS(el.borderRadius),
              fontFamily: el.textStyle.fontFamily,
              fontSize: el.textStyle.fontSize,
              color: '#888888',
              padding: `${el.padding.top}px ${el.padding.right}px ${el.padding.bottom}px ${el.padding.left}px`
            }}
          >
            {el.placeholder}
          </div>
        );
      }

      case 'rectangle': {
        const el = element as RectangleElement;
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: el.fill?.color || 'transparent',
              border: el.stroke ? `${el.stroke.width}px ${el.stroke.style} ${el.stroke.color}` : 'none',
              borderRadius: getBorderRadiusCSS(el.borderRadius),
              boxShadow: el.shadow 
                ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.spread}px ${el.shadow.color}`
                : 'none'
            }}
          />
        );
      }

      case 'circle': {
        const el = element as CircleElement;
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: el.fill?.color || 'transparent',
              border: el.stroke ? `${el.stroke.width}px ${el.stroke.style} ${el.stroke.color}` : 'none',
              boxShadow: el.shadow 
                ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.spread}px ${el.shadow.color}`
                : 'none'
            }}
          />
        );
      }

      case 'line': {
        const el = element as LineElement;
        const dx = el.endPoint.x - el.startPoint.x;
        const dy = el.endPoint.y - el.startPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return (
          <div
            className="absolute origin-left"
            style={{
              width: length,
              height: el.stroke.width,
              backgroundColor: el.stroke.color,
              transform: `rotate(${angle}deg)`,
              top: '50%',
              left: 0
            }}
          />
        );
      }

      case 'arrow': {
        const el = element as ArrowElement;
        return (
          <svg className="w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <marker
                id={`arrow-${el.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={el.stroke.color}
                />
              </marker>
            </defs>
            <line
              x1={0}
              y1={element.bounds.height / 2}
              x2={element.bounds.width}
              y2={element.bounds.height / 2}
              stroke={el.stroke.color}
              strokeWidth={el.stroke.width}
              markerEnd={el.arrowHead === 'end' || el.arrowHead === 'both' ? `url(#arrow-${el.id})` : undefined}
              markerStart={el.arrowHead === 'start' || el.arrowHead === 'both' ? `url(#arrow-${el.id})` : undefined}
            />
          </svg>
        );
      }

      case 'image': {
        const el = element as ImageElement;
        return (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: getBorderRadiusCSS(el.borderRadius),
              backgroundColor: '#2a2a3e'
            }}
          >
            {el.src ? (
              <img
                src={el.src}
                alt={el.alt}
                className="w-full h-full"
                style={{ objectFit: el.objectFit }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="text-xs opacity-50">Image</span>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: element.opacity, scale: 1, rotate: element.rotation }}
      transition={{ duration: 0 }}
      className="absolute"
      style={{
        left: element.bounds.x,
        top: element.bounds.y,
        width: element.bounds.width,
        height: element.bounds.height,
        zIndex: element.zIndex,
        cursor: element.locked ? 'not-allowed' : 'move',
        display: element.visible ? 'block' : 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}

      {/* Selection outline */}
      {(isSelected || isHovered) && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            border: isSelected ? '2px solid #a855f7' : '1px solid #a855f7',
            borderRadius: 2
          }}
        />
      )}

      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          {resizeHandles.map(handle => (
            <div
              key={handle}
              className="absolute w-2 h-2 bg-white border border-primary rounded-sm"
              style={getHandlePosition(handle)}
              onMouseDown={(e) => handleResizeMouseDown(handle, e)}
            />
          ))}
        </>
      )}

      {/* Element label */}
      {isSelected && (
        <div 
          className="absolute -top-6 left-0 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded whitespace-nowrap"
        >
          {element.name}
        </div>
      )}
    </motion.div>
  );
});

CanvasElementComponent.displayName = 'CanvasElement';

export default CanvasElementComponent;
