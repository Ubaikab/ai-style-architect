import { motion } from "framer-motion";
import { 
  Square, 
  Circle, 
  Type, 
  Minus, 
  MousePointer, 
  Hand,
  ZoomIn,
  ZoomOut 
} from "lucide-react";

const CanvasPreview = () => {
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
            Intuitive canvas for
            <br />
            <span className="gradient-text">rapid prototyping</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sketch your ideas with familiar tools, then let AI transform them into production code.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Canvas mockup */}
          <div className="rounded-2xl glass-card overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <div className="w-3 h-3 rounded-full bg-primary/80" />
                </div>
              </div>
              
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
                {[MousePointer, Hand, Square, Circle, Type, Minus].map((Icon, i) => (
                  <button
                    key={i}
                    className={`p-2 rounded-md transition-colors ${
                      i === 2 ? "bg-primary text-primary-foreground" : "hover:bg-white/10 text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md hover:bg-white/10 text-muted-foreground">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground">100%</span>
                <button className="p-2 rounded-md hover:bg-white/10 text-muted-foreground">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas area */}
            <div className="relative h-96 bg-[#0a0a0f] overflow-hidden">
              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(240 15% 20%) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(240 15% 20%) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Sketch elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute top-8 left-8 w-64 h-40 rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center"
              >
                <span className="text-primary/70 text-sm">Hero Section</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute top-8 right-8 w-48 h-24 rounded-xl border-2 border-accent/50 flex items-center justify-center"
              >
                <span className="text-accent/70 text-sm">Navigation</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-80 h-32 rounded-xl border-2 border-secondary/50 flex items-center justify-center"
              >
                <span className="text-secondary-foreground/70 text-sm">Feature Cards</span>
              </motion.div>

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.line
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  x1="272" y1="88" x2="350" y2="88"
                  stroke="hsl(262 83% 58% / 0.3)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-xs text-muted-foreground">
              <span>3 elements selected</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Autosave enabled
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CanvasPreview;
