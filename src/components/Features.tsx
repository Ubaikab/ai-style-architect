import { motion } from "framer-motion";
import { 
  Palette, 
  Code, 
  Layers, 
  Wand2, 
  Layout, 
  Sparkles 
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Design System Generation",
    description: "Upload mood boards and automatically generate cohesive color palettes and typography systems.",
  },
  {
    icon: Code,
    title: "Tailwind CSS Export",
    description: "Convert sketches directly to production-ready Tailwind CSS components with clean, maintainable code.",
  },
  {
    icon: Layers,
    title: "Interactive Canvas",
    description: "Draw shapes, frames, text, and lines with intuitive tools. Zoom, pan, and manipulate elements freely.",
  },
  {
    icon: Wand2,
    title: "AI Redesign",
    description: "Redesign existing interfaces while maintaining visual consistency and brand identity.",
  },
  {
    icon: Layout,
    title: "Workflow Pages",
    description: "Generate complementary pages like dashboards, settings, and profiles that match your design.",
  },
  {
    icon: Sparkles,
    title: "Real-time Preview",
    description: "See your designs come to life instantly with live previews and responsive breakpoints.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Features = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything you need to
            <br />
            <span className="gradient-text">design faster</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful AI tools that bridge the gap between early concepts and functional frontend code.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="group p-6 rounded-2xl glass-card hover:bg-white/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
