import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import { useStructuredCanvas } from '../hooks/useStructuredCanvas';
import StructuredToolbar from '../structured/StructuredToolbar';
import StructuredCanvasRenderer from '../structured/StructuredCanvasRenderer';
import PropertyPanel from '../structured/PropertyPanel';
import { CanvasElement } from '../types/elements';

interface CanvasSectionProps {
  onCanvasChange: (json: {
    elements: Record<string, CanvasElement>;
    rootIds: string[];
  }) => void;
}

const CanvasSection = ({ onCanvasChange }: CanvasSectionProps) => {
  const {
    state,
    activeTool,
    setActiveTool,
    snapGuides,
    selectElement,
    moveElement,
    resizeElement,
    updateElement,
    deleteSelected,
    startDrawing,
    continueDrawing,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    exportAsJSON,
    canUndo,
    canRedo,
    selectedElements,
    saveHistoryOnce,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    alignElements,
    distributeElements
  } = useStructuredCanvas();

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Notify parent when canvas changes
  useEffect(() => {
    onCanvasChange(exportAsJSON());
  }, [state.elements, state.rootIds, exportAsJSON, onCanvasChange]);

  // 🔥 Keyboard Handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isEditable) return;

      // Space = temporary hand tool
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(true);
        setActiveTool('hand');
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedIds.length > 0) deleteSelected();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      if (e.key === 'v') setActiveTool('select');
      if (e.key === 'h') setActiveTool('hand');
      if (e.key === 'f') setActiveTool('frame');
      if (e.key === 't') setActiveTool('text');
      if (e.key === 'r') setActiveTool('rectangle');
      if (e.key === 'o') setActiveTool('circle');
      if (e.key === 'l') setActiveTool('line');
    },
    [state.selectedIds, deleteSelected, undo, redo, setActiveTool]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacePressed) {
        setIsSpacePressed(false);
        setActiveTool('select');
      }
    },
    [isSpacePressed, setActiveTool]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isEmpty = Object.keys(state.elements).length === 0;

  return (
    <section className="py-12 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card mb-4">
            <span className="text-xs font-medium">Step 2</span>
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Design Your Layout
          </h2>

          <p className="text-muted-foreground max-w-xl mx-auto">
            Use the Figma-like editor to create your UI wireframe.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="rounded-2xl glass-card overflow-hidden shadow-2xl">
            
            {/* Toolbar */}
            <StructuredToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onUndo={undo}
              onRedo={redo}
              onDelete={deleteSelected}
              canUndo={canUndo}
              canRedo={canRedo}
              hasSelection={state.selectedIds.length > 0}
            />

            <div className="flex h-[500px]">
              
              {/* 🔥 Stable Canvas */}
              <div
                className="flex-1 relative touch-none overflow-hidden"
                style={{ touchAction: 'none' }}
              >
                <StructuredCanvasRenderer
                  elements={state.elements}
                  rootIds={state.rootIds}
                  selectedIds={state.selectedIds}
                  hoveredId={state.hoveredId}
                  activeTool={activeTool}
                  snapGuides={snapGuides}
                  onSelect={selectElement}
                  onMove={moveElement}
                  onResize={resizeElement}
                  onStartDrawing={startDrawing}
                  onContinueDrawing={continueDrawing}
                  onStopDrawing={stopDrawing}
                  onSaveHistory={saveHistoryOnce}
                />

                {isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="w-8 h-8 text-primary/50" />
                      </div>
                      <p className="text-foreground font-medium mb-1">
                        Create your wireframe
                      </p>
                      <p className="text-muted-foreground text-sm max-w-xs">
                        Select a tool and start drawing
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Panel */}
              <div className="w-64 border-l border-border/50 bg-card/30">
                <PropertyPanel
                  selectedElements={selectedElements}
                  onUpdateElement={updateElement}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  onBringForward={bringForward}
                  onSendBackward={sendBackward}
                  onAlignElements={alignElements}
                  onDistributeElements={distributeElements}
                />
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-xs text-muted-foreground bg-card/30">
              <span>{Object.keys(state.elements).length} elements</span>
              <div className="flex items-center gap-4">
                <span>Tool: {activeTool}</span>
                {state.selectedIds.length > 0 && (
                  <span>{state.selectedIds.length} selected</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CanvasSection;
