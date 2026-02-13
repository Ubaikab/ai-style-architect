import { useRef, useEffect, useCallback } from 'react';
import { DrawElement, Point } from './types';

interface CanvasRendererProps {
  elements: DrawElement[];
  currentElement: DrawElement | null;
  onStartDrawing: (point: Point) => void;
  onContinueDrawing: (point: Point) => void;
  onStopDrawing: () => void;
}

const CanvasRenderer = ({
  elements,
  currentElement,
  onStartDrawing,
  onContinueDrawing,
  onStopDrawing,
}: CanvasRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DrawElement) => {
    if (element.points.length === 0) return;

    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { points, type } = element;

    switch (type) {
      case 'pen':
      case 'eraser':
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        break;

      case 'line':
        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (points.length >= 2) {
          const start = points[0];
          const end = points[points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
        }
        break;

      case 'circle':
        if (points.length >= 2) {
          const start = points[0];
          const end = points[points.length - 1];
          const radiusX = Math.abs(end.x - start.x) / 2;
          const radiusY = Math.abs(end.y - start.y) / 2;
          const centerX = start.x + (end.x - start.x) / 2;
          const centerY = start.y + (end.y - start.y) / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.text && points.length > 0) {
          ctx.font = `${element.strokeWidth * 8}px Space Grotesk, sans-serif`;
          ctx.fillText(element.text, points[0].x, points[0].y);
        }
        break;
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all elements
    elements.forEach(element => drawElement(ctx, element));

    // Draw current element
    if (currentElement) {
      drawElement(ctx, currentElement);
    }
  }, [elements, currentElement, drawElement]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onStartDrawing(getPoint(e));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    onContinueDrawing(getPoint(e));
  };

  const handleMouseUp = () => {
    onStopDrawing();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onStartDrawing(getPoint(e));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    onContinueDrawing(getPoint(e));
  };

  const handleTouchEnd = () => {
    onStopDrawing();
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default CanvasRenderer;
