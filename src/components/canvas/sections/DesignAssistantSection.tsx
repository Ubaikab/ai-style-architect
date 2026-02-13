import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { s2cApi } from '@/lib/api/s2c';
import { TypographySystem, ColorPalette, GeneratedUI, DesignChatMessage } from '../types';
import { CanvasElement } from '../types/elements';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DesignAssistantSectionProps {
  canvasData: {elements: Record<string, CanvasElement>;rootIds: string[];} | null;
  typography: TypographySystem | null;
  colorPalette: ColorPalette | null;
  moodboardBase64: string | null;
  onUIGenerated: (ui: GeneratedUI) => void;
}

const DesignAssistantSection = ({
  canvasData,
  typography,
  colorPalette,
  moodboardBase64,
  onUIGenerated
}: DesignAssistantSectionProps) => {
  const [messages, setMessages] = useState<DesignChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const hasLayout = canvasData && canvasData.rootIds.length > 0;
  const hasDesignSystem = !!(typography || colorPalette);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    if (!hasLayout) {
      toast({
        title: 'No layout created',
        description: 'Please create a layout in the canvas section first',
        variant: 'destructive'
      });
      return;
    }

    const userMessage: DesignChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Convert canvas JSON to a base64 representation for the AI
      // In a real implementation, you'd render the canvas to an image
      const layoutDescription = JSON.stringify(canvasData, null, 2);

      // Create a combined prompt that includes the layout structure
      const enhancedPrompt = `
Layout Structure (JSON):
${layoutDescription}

User Request: ${input.trim()}

Please transform this wireframe layout into a beautiful, production-ready UI design.
Apply the following design system:
- Colors: ${colorPalette ? JSON.stringify(colorPalette) : 'Use modern, professional colors'}
- Typography: ${typography ? JSON.stringify(typography.typography.fonts) : 'Use clean, readable fonts'}
`;

      const result = await s2cApi.generateUI(
        moodboardBase64 || '',
        enhancedPrompt,
        {
          typography: typography || undefined,
          colorPalette: colorPalette || undefined,
          conversationHistory: messages
        }
      );

      if (result.success && result.data) {
        onUIGenerated(result.data);

        const assistantMessage: DesignChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: result.data.description || 'I\'ve transformed your wireframe into a polished UI design! Check the preview below.',
          imageUrl: result.data.imageUrl,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        toast({
          title: 'UI Generated!',
          description: 'Your layout has been transformed'
        });
      } else {
        const errorMessage: DesignChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `I couldn't generate the UI: ${result.error || 'Unknown error'}. Please try a different approach.`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to AI service',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [input, hasLayout, canvasData, typography, colorPalette, moodboardBase64, messages, toast, onUIGenerated]);

  const suggestedPrompts = [
  'Make it modern and minimal with subtle shadows',
  'Add a glassmorphism effect with blur backgrounds',
  'Use a dark theme with vibrant accent colors',
  'Make it feel premium with elegant typography'];


  return (
    <section className="py-12 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card mb-4">
            <span className="text-xs font-medium">Step 3</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Describe Your Vision
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tell the AI how you want your wireframe to be styled. It will use your layout, colors, and typography to generate a beautiful UI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto">

          <div className="rounded-2xl glass-card overflow-hidden">
            {/* Status Bar */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Design Assistant</span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-3 text-xs">
                <span className={hasLayout ? 'text-primary' : 'text-muted-foreground'}>
                  {hasLayout ? '✓ Layout ready' : '○ Need layout'}
                </span>
                <span className={hasDesignSystem ? 'text-primary' : 'text-muted-foreground'}>
                  {hasDesignSystem ? '✓ Design system' : '○ No design system'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-64">
              <div className="p-4 space-y-4">
                {messages.length === 0 ?
                <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center border-primary bg-muted">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      Describe how you want your UI to look
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestedPrompts.map((prompt, i) =>
                    <button
                      key={i}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-1.5 text-xs rounded-full text-muted-foreground hover:text-foreground transition-colors bg-muted">

                          {prompt}
                        </button>
                    )}
                    </div>
                  </div> :

                messages.map((message) =>
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                      <div className="">






                        <p className="text-sm">{message.content}</p>
                        {message.imageUrl &&
                    <img
                      src={message.imageUrl}
                      alt="Generated UI"
                      className="mt-2 rounded-lg max-w-full" />

                    }
                      </div>
                    </div>
                )
                }
                {isGenerating &&
                <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating your UI...</span>
                    </div>
                  </div>
                }
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={hasLayout ? "Describe how you want your UI to look..." : "Create a layout in the canvas first..."}
                  className="min-h-[60px] resize-none"
                  disabled={!hasLayout || isGenerating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }} />

                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || !hasLayout || isGenerating}
                  className="self-end">

                  {isGenerating ?
                  <Loader2 className="w-4 h-4 animate-spin" /> :

                  <Sparkles className="w-4 h-4" />
                  }
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

};

export default DesignAssistantSection;