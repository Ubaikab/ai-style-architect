import { useState, useCallback, useRef } from 'react';
import { Tool, DrawElement, Point, CanvasState } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useCanvas = () => {
  const [state, setState] = useState<CanvasState>({
    elements: [],
    currentElement: null,
    selectedTool: 'pen',
    strokeColor: '#a855f7',
    strokeWidth: 2,
    history: [[]],
    historyIndex: 0,
  });

  const isDrawing = useRef(false);

  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, selectedTool: tool }));
  }, []);

  const setColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, strokeColor: color }));
  }, []);

  const setStrokeWidth = useCallback((width: number) => {
    setState(prev => ({ ...prev, strokeWidth: width }));
  }, []);

  const startDrawing = useCallback((point: Point) => {
    if (state.selectedTool === 'select') return;
    
    isDrawing.current = true;
    const newElement: DrawElement = {
      id: generateId(),
      type: state.selectedTool,
      points: [point],
      color: state.selectedTool === 'eraser' ? '#0a0a0f' : state.strokeColor,
      strokeWidth: state.selectedTool === 'eraser' ? 20 : state.strokeWidth,
    };

    setState(prev => ({ ...prev, currentElement: newElement }));
  }, [state.selectedTool, state.strokeColor, state.strokeWidth]);

  const continueDrawing = useCallback((point: Point) => {
    if (!isDrawing.current || !state.currentElement) return;

    setState(prev => {
      if (!prev.currentElement) return prev;
      
      const updatedElement = {
        ...prev.currentElement,
        points: [...prev.currentElement.points, point],
      };
      
      return { ...prev, currentElement: updatedElement };
    });
  }, [state.currentElement]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current || !state.currentElement) {
      isDrawing.current = false;
      return;
    }

    isDrawing.current = false;
    
    setState(prev => {
      if (!prev.currentElement) return prev;
      
      const newElements = [...prev.elements, prev.currentElement];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newElements);
      
      return {
        ...prev,
        elements: newElements,
        currentElement: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, [state.currentElement]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        elements: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        elements: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const clearCanvas = useCallback(() => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push([]);
      return {
        ...prev,
        elements: [],
        currentElement: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const setElements = useCallback((elements: DrawElement[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(elements);
      return {
        ...prev,
        elements,
        currentElement: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  return {
    state,
    setTool,
    setColor,
    setStrokeWidth,
    startDrawing,
    continueDrawing,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    setElements,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };
};
