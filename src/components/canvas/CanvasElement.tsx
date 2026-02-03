import { Group, Rect, Text, Circle, Line } from "react-konva";
import type Konva from "konva";
import type { CanvasElement as CanvasElementType } from "@/types/canvas";

interface CanvasElementProps {
  element: CanvasElementType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  children?: React.ReactNode;
}

export function CanvasElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  children,
}: CanvasElementProps) {
  const { type, x, y, width, height, rotation, style, text, placeholder, id, locked } = element;

  const commonProps = {
    id,
    x,
    y,
    width,
    height,
    rotation,
    draggable: !locked,
    onClick: onSelect,
    onDragEnd,
    onTransformEnd,
  };

  const renderContent = () => {
    switch (type) {
      case 'frame':
      case 'section':
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill={style.fill || 'transparent'}
              stroke={isSelected ? '#6366f1' : (style.stroke || '#3b82f6')}
              strokeWidth={style.strokeWidth || 1}
              cornerRadius={style.cornerRadius || 0}
              dash={type === 'frame' ? [5, 5] : undefined}
            />
            {/* Frame label */}
            <Text
              x={4}
              y={-20}
              text={element.name}
              fontSize={11}
              fill="#9ca3af"
              fontFamily="Inter"
            />
            {children}
          </Group>
        );

      case 'text':
        return (
          <Group {...commonProps}>
            <Text
              width={width}
              height={height}
              text={text || 'Text'}
              fontSize={style.fontSize || 16}
              fontStyle={style.fontWeight === 'bold' ? 'bold' : 'normal'}
              fill={style.fill || '#ffffff'}
              align={style.textAlign || 'left'}
              verticalAlign="middle"
              fontFamily="Inter"
            />
          </Group>
        );

      case 'button':
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill={style.fill || '#6366f1'}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              cornerRadius={style.cornerRadius || 6}
              shadowColor="rgba(99, 102, 241, 0.3)"
              shadowBlur={8}
              shadowOffsetY={2}
            />
            <Text
              width={width}
              height={height}
              text={text || 'Button'}
              fontSize={14}
              fontStyle="600"
              fill="#ffffff"
              align="center"
              verticalAlign="middle"
              fontFamily="Inter"
            />
            {children}
          </Group>
        );

      case 'input':
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill={style.fill || '#1f2937'}
              stroke={style.stroke || '#374151'}
              strokeWidth={style.strokeWidth || 1}
              cornerRadius={style.cornerRadius || 6}
            />
            <Text
              x={12}
              width={width - 24}
              height={height}
              text={placeholder || 'Enter text...'}
              fontSize={14}
              fill="#6b7280"
              align="left"
              verticalAlign="middle"
              fontFamily="Inter"
            />
            {children}
          </Group>
        );

      case 'card':
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill={style.fill || '#111827'}
              stroke={style.stroke || '#1f2937'}
              strokeWidth={style.strokeWidth || 1}
              cornerRadius={style.cornerRadius || 12}
              shadowColor="rgba(0, 0, 0, 0.3)"
              shadowBlur={12}
              shadowOffsetY={4}
            />
            {children}
          </Group>
        );

      case 'image':
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill={style.fill || '#374151'}
              stroke={style.stroke || '#4b5563'}
              strokeWidth={style.strokeWidth || 1}
              cornerRadius={style.cornerRadius || 4}
            />
            {/* Image placeholder icon */}
            <Text
              width={width}
              height={height}
              text="🖼️"
              fontSize={Math.min(width, height) * 0.3}
              align="center"
              verticalAlign="middle"
            />
            {children}
          </Group>
        );

      case 'rectangle':
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill={style.fill || '#6366f1'}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              cornerRadius={style.cornerRadius || 0}
            />
            {children}
          </Group>
        );

      case 'circle':
        return (
          <Group {...commonProps} x={x + width / 2} y={y + height / 2}>
            <Circle
              x={0}
              y={0}
              radius={Math.min(width, height) / 2}
              fill={style.fill || '#8b5cf6'}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
            />
            {children}
          </Group>
        );

      case 'line':
        return (
          <Group {...commonProps}>
            <Line
              points={element.points || [0, 0, width, 0]}
              stroke={style.stroke || '#9ca3af'}
              strokeWidth={style.strokeWidth || 2}
              lineCap="round"
            />
            {children}
          </Group>
        );

      default:
        return (
          <Group {...commonProps}>
            <Rect
              width={width}
              height={height}
              fill="#374151"
              stroke="#4b5563"
            />
            {children}
          </Group>
        );
    }
  };

  return renderContent();
}
