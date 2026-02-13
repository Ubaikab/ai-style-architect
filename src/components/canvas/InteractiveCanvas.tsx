import { motion } from "framer-motion";
import Toolbar from "./Toolbar";
import CanvasRenderer from "./CanvasRenderer";
import { useCanvas } from "./useCanvas";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const InteractiveCanvas = () => {
  const {
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
    canUndo,
    canRedo,
  } = useCanvas();

  return (
    <section id="canvas" className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Try the canvas
            <br />
            <span className="gradient-text">right now</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Draw shapes, sketch wireframes, and see how easy it is. This is a live demo - try it!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Canvas container */}
          <div className="rounded-2xl glass-card overflow-hidden shadow-2xl">
            <Toolbar
              selectedTool={state.selectedTool}
              strokeColor={state.strokeColor}
              strokeWidth={state.strokeWidth}
              onToolChange={setTool}
              onColorChange={setColor}
              onStrokeWidthChange={setStrokeWidth}
              onUndo={undo}
              onRedo={redo}
              onClear={clearCanvas}
              canUndo={canUndo}
              canRedo={canRedo}
            />

            {/* Canvas area */}
            <div className="h-[400px] md:h-[500px] relative">
              <CanvasRenderer
                elements={state.elements}
                currentElement={state.currentElement}
                onStartDrawing={startDrawing}
                onContinueDrawing={continueDrawing}
                onStopDrawing={stopDrawing}
              />

              {/* Empty state overlay */}
              {state.elements.length === 0 && !state.currentElement && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground text-lg mb-2">Start drawing here</p>
                    <p className="text-muted-foreground/60 text-sm">Select a tool and sketch your ideas</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-xs text-muted-foreground bg-card/30">
              <span>{state.elements.length} elements</span>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">Tool: {state.selectedTool}</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Ready to draw
                </span>
              </div>
            </div>
          </div>

          {/* CTA below canvas */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Love this? Sign up to unlock AI-powered sketch-to-code conversion.
            </p>
            <Button variant="hero" size="lg">
              <Sparkles className="w-4 h-4" />
              Convert Sketch to Code
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveCanvas;
