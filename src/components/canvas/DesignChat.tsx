import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DesignChatMessage } from './types';
import { cn } from '@/lib/utils';

interface DesignChatProps {
  messages: DesignChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  hasSketch: boolean;
  hasDesignSystem: boolean;
}

const suggestedPrompts = [
  "Make it modern and minimal with lots of whitespace",
  "Give it a bold, colorful look with gradients",
  "Create a dark theme with neon accents",
  "Make it look professional and corporate",
  "Add playful, rounded elements with soft shadows",
];

const DesignChat = ({ 
  messages, 
  onSendMessage, 
  isGenerating, 
  hasSketch,
  hasDesignSystem 
}: DesignChatProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating || !hasSketch) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (!hasSketch) return;
    onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Design Assistant</h3>
          <p className="text-xs text-muted-foreground">
            {hasDesignSystem ? 'Using your design system' : 'Upload a moodboard for better results'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2">Transform Your Sketch</h4>
            <p className="text-sm text-muted-foreground mb-6">
              {hasSketch 
                ? "Describe how you want your sketch transformed into a beautiful UI"
                : "Draw a sketch on the canvas first, then describe your vision"
              }
            </p>
            
            {hasSketch && (
              <div className="w-full space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Try these prompts:</p>
                {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="w-full text-left text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <img 
                          src={msg.imageUrl} 
                          alt="Generated UI" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    <p className="text-[10px] opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Generating your UI...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border/50">
        {!hasSketch && (
          <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Draw a sketch on the canvas first
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasSketch ? "Describe how you want your UI to look..." : "Draw a sketch first..."}
            disabled={!hasSketch || isGenerating}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating || !hasSketch}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesignChat;
