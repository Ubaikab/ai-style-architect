import { motion } from 'framer-motion';
import { Image, Pencil, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExampleItem {
  id: string;
  name: string;
  type: 'moodboard' | 'sketch';
  description: string;
  imageUrl: string;
  base64?: string;
}

interface ExampleGalleryProps {
  onSelectMoodboard: (base64: string) => void;
  onSelectSketch: (elements: unknown[]) => void;
  isLoading?: boolean;
}

// Example mood boards and sketches (using placeholder gradients)
const examples: ExampleItem[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    type: 'moodboard',
    description: 'Clean lines, sans-serif fonts, muted colors',
    imageUrl: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'bold-creative',
    name: 'Bold Creative',
    type: 'moodboard',
    description: 'Vibrant colors, expressive typography',
    imageUrl: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    type: 'moodboard',
    description: 'Dark theme, luxury feel, serif accents',
    imageUrl: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  {
    id: 'login-form',
    name: 'Login Form',
    type: 'sketch',
    description: 'Simple authentication layout',
    imageUrl: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    type: 'sketch',
    description: 'Analytics dashboard with cards',
    imageUrl: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  },
  {
    id: 'landing-hero',
    name: 'Landing Hero',
    type: 'sketch',
    description: 'Hero section with CTA',
    imageUrl: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  },
];

const ExampleGallery = ({ onSelectMoodboard, onSelectSketch, isLoading }: ExampleGalleryProps) => {
  const moodboards = examples.filter((e) => e.type === 'moodboard');
  const sketches = examples.filter((e) => e.type === 'sketch');

  const handleSelect = async (example: ExampleItem) => {
    if (example.type === 'moodboard') {
      // Generate a sample base64 from the gradient (simplified demo)
      // In production, this would be actual image data
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        if (example.id === 'modern-minimal') {
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
        } else if (example.id === 'bold-creative') {
          gradient.addColorStop(0, '#f093fb');
          gradient.addColorStop(1, '#f5576c');
        } else {
          gradient.addColorStop(0, '#1a1a2e');
          gradient.addColorStop(1, '#16213e');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // Add some text elements to simulate a mood board
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 32px Inter';
        ctx.fillText('Aa Bb Cc', 30, 60);
        ctx.font = '18px Inter';
        ctx.fillText('Typography Sample', 30, 100);
        ctx.fillRect(30, 130, 100, 4);
        ctx.fillRect(30, 150, 60, 4);
        
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        onSelectMoodboard(base64);
      }
    } else {
      // Generate sample sketch elements
      const sampleElements = generateSampleSketch(example.id);
      onSelectSketch(sampleElements);
    }
  };

  const generateSampleSketch = (sketchId: string) => {
    const baseId = Date.now();
    
    if (sketchId === 'login-form') {
      return [
        { id: `${baseId}-1`, type: 'rectangle', points: [{ x: 150, y: 50 }, { x: 350, y: 350 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-2`, type: 'rectangle', points: [{ x: 170, y: 120 }, { x: 330, y: 160 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-3`, type: 'rectangle', points: [{ x: 170, y: 180 }, { x: 330, y: 220 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-4`, type: 'rectangle', points: [{ x: 170, y: 260 }, { x: 330, y: 300 }], color: '#6366f1', strokeWidth: 2 },
      ];
    } else if (sketchId === 'dashboard') {
      return [
        { id: `${baseId}-1`, type: 'rectangle', points: [{ x: 20, y: 20 }, { x: 480, y: 60 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-2`, type: 'rectangle', points: [{ x: 20, y: 80 }, { x: 150, y: 200 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-3`, type: 'rectangle', points: [{ x: 170, y: 80 }, { x: 300, y: 200 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-4`, type: 'rectangle', points: [{ x: 320, y: 80 }, { x: 480, y: 200 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-5`, type: 'rectangle', points: [{ x: 20, y: 220 }, { x: 480, y: 400 }], color: '#6366f1', strokeWidth: 2 },
      ];
    } else {
      return [
        { id: `${baseId}-1`, type: 'rectangle', points: [{ x: 20, y: 20 }, { x: 480, y: 80 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-2`, type: 'rectangle', points: [{ x: 100, y: 120 }, { x: 400, y: 180 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-3`, type: 'line', points: [{ x: 100, y: 200 }, { x: 400, y: 200 }], color: '#6366f1', strokeWidth: 2 },
        { id: `${baseId}-4`, type: 'rectangle', points: [{ x: 180, y: 240 }, { x: 320, y: 290 }], color: '#6366f1', strokeWidth: 2 },
      ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Mood Boards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Image className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Mood Boards</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {moodboards.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                className="w-full h-auto p-0 overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all group"
                onClick={() => handleSelect(example)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3 p-2 w-full">
                  <div
                    className="w-12 h-12 rounded-md shrink-0"
                    style={{ background: example.imageUrl }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{example.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {example.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sketches */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Pencil className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Example Sketches</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {sketches.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + moodboards.length) * 0.1 }}
            >
              <Button
                variant="ghost"
                className="w-full h-auto p-0 overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all group"
                onClick={() => handleSelect(example)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3 p-2 w-full">
                  <div
                    className="w-12 h-12 rounded-md shrink-0"
                    style={{ background: example.imageUrl }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{example.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {example.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExampleGallery;
