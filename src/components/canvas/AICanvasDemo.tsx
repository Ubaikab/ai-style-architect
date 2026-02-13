import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, PanelLeftClose, PanelLeft, Palette, FolderOpen, Image, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Toolbar from './Toolbar';
import CanvasRenderer from './CanvasRenderer';
import { useCanvas } from './useCanvas';
import MoodBoardUploader from './MoodBoardUploader';
import TypographyPreview from './TypographyPreview';
import ColorPalettePreview from './ColorPalettePreview';
import GeneratedUIPreview from './GeneratedUIPreview';
import ExampleGallery from './ExampleGallery';
import ExportButton from './ExportButton';
import SaveDesignButton from './SaveDesignButton';
import SavedDesignsPanel from './SavedDesignsPanel';
import DesignChat from './DesignChat';
import { TypographySystem, GeneratedUI, ColorPalette, DrawElement, DesignChatMessage } from './types';
import { s2cApi } from '@/lib/api/s2c';

type SidebarTab = 'upload' | 'typography' | 'colors' | 'examples' | 'saved';

const AICanvasDemo = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [typography, setTypography] = useState<TypographySystem | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [generatedUI, setGeneratedUI] = useState<GeneratedUI | null>(null);
  const [isExtractingTypography, setIsExtractingTypography] = useState(false);
  const [isGeneratingUI, setIsGeneratingUI] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('upload');
  const [moodboardBase64, setMoodboardBase64] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<DesignChatMessage[]>([]);
  const { toast } = useToast();

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
    setElements,
  } = useCanvas();

  const handleMoodBoardUpload = useCallback(async (base64: string) => {
    setIsExtractingTypography(true);
    setActiveTab('typography');
    setMoodboardBase64(base64);
    
    try {
      const result = await s2cApi.extractTypography(base64);
      
      if (result.success && result.data) {
        setTypography(result.data);
        if (result.data.colorPalette) {
          setColorPalette(result.data.colorPalette);
        }
        toast({
          title: 'Design System Extracted!',
          description: 'Typography and colors generated from your mood board',
        });
      } else {
        toast({
          title: 'Extraction Failed',
          description: result.error || 'Could not analyze the image',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to connect to AI service',
        variant: 'destructive',
      });
    } finally {
      setIsExtractingTypography(false);
    }
  }, [toast]);

  const handleExampleSketchSelect = useCallback((elements: unknown[]) => {
    setElements(elements as DrawElement[]);
    toast({
      title: 'Sketch loaded',
      description: 'Example sketch has been loaded to the canvas',
    });
  }, [setElements, toast]);

  const handleLoadDesign = useCallback((design: {
    elements: DrawElement[];
    typography: TypographySystem | null;
    colorPalette: ColorPalette | null;
    generatedUI: GeneratedUI | null;
  }) => {
    if (design.elements.length > 0) {
      setElements(design.elements);
    }
    if (design.typography) {
      setTypography(design.typography);
    }
    if (design.colorPalette) {
      setColorPalette(design.colorPalette);
    }
    if (design.generatedUI) {
      setGeneratedUI(design.generatedUI);
    }
  }, [setElements]);

  const captureCanvas = useCallback((): string | null => {
    const container = canvasContainerRef.current;
    if (!container) return null;

    const canvas = container.querySelector('canvas');
    if (!canvas) return null;

    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1];
  }, []);

  const handleChatMessage = useCallback(async (message: string) => {
    if (state.elements.length === 0) {
      toast({
        title: 'Canvas is empty',
        description: 'Please draw a wireframe first',
        variant: 'destructive',
      });
      return;
    }

    const sketchBase64 = captureCanvas();
    if (!sketchBase64) {
      toast({
        title: 'Error',
        description: 'Could not capture canvas',
        variant: 'destructive',
      });
      return;
    }

    // Add user message to chat
    const userMessage: DesignChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsGeneratingUI(true);

    try {
      const result = await s2cApi.generateUI(sketchBase64, message, {
        moodboardBase64: moodboardBase64 || undefined,
        typography: typography || undefined,
        colorPalette: colorPalette || undefined,
        conversationHistory: chatMessages,
      });
      
      if (result.success && result.data) {
        setGeneratedUI(result.data);
        
        // Add assistant response to chat
        const assistantMessage: DesignChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: result.data.description || 'Here\'s your generated UI! You can edit it using the tools above, or describe more changes.',
          imageUrl: result.data.imageUrl,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
        
        toast({
          title: 'UI Generated!',
          description: 'Your sketch has been transformed',
        });
      } else {
        // Add error message
        const errorMessage: DesignChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `I couldn't generate the UI: ${result.error || 'Unknown error'}. Please try a different prompt.`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: 'Generation Failed',
          description: result.error || 'Could not generate UI',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to connect to AI service',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingUI(false);
    }
  }, [state.elements, typography, colorPalette, moodboardBase64, chatMessages, captureCanvas, toast]);

  const handleRegenerateArea = useCallback(async (
    area: { x: number; y: number; width: number; height: number },
    prompt: string
  ) => {
    // This would be implemented to regenerate only a specific area
    toast({
      title: 'Regenerating area...',
      description: 'This feature will regenerate just the selected portion',
    });
    // For now, regenerate the whole thing with the area prompt
    handleChatMessage(`Focus on this area and ${prompt}`);
  }, [handleChatMessage, toast]);

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <Image className="w-3 h-3" /> },
    { id: 'typography', label: 'Type', icon: <span className="text-xs font-bold">Aa</span> },
    { id: 'colors', label: 'Colors', icon: <Palette className="w-3 h-3" /> },
    { id: 'examples', label: 'Examples', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'saved', label: 'Saved', icon: <FolderOpen className="w-3 h-3" /> },
  ];

  return (
    <section id="canvas" className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] bg-primary/5 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">AI-Powered Design System</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            From sketch to beautiful UI
            <br />
            <span className="gradient-text">in seconds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload mood boards for design tokens, draw wireframes, and chat with AI to transform your sketches into stunning visual designs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex gap-4">
            {/* Left Sidebar */}
            {showSidebar && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-72 shrink-0"
              >
                <div className="rounded-2xl glass-card overflow-hidden h-full">
                  {/* Tabs */}
                  <div className="flex border-b border-border/50 overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-0 px-2 py-3 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                          activeTab === tab.id
                            ? 'text-foreground border-b-2 border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.icon}
                        <span className="truncate">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="h-[500px]">
                    {activeTab === 'upload' && (
                      <div className="p-4">
                        <MoodBoardUploader
                          onImageUploaded={handleMoodBoardUpload}
                          isLoading={isExtractingTypography}
                        />
                        {(typography || colorPalette) && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm text-foreground flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Design system ready!
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {typography && 'Typography'}{typography && colorPalette && ' & '}{colorPalette && 'Colors'} extracted
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'typography' && (
                      <TypographyPreview typography={typography} />
                    )}
                    {activeTab === 'colors' && (
                      <ColorPalettePreview colorPalette={colorPalette} />
                    )}
                    {activeTab === 'examples' && (
                      <div className="p-4 h-full overflow-y-auto">
                        <ExampleGallery
                          onSelectMoodboard={handleMoodBoardUpload}
                          onSelectSketch={handleExampleSketchSelect}
                          isLoading={isExtractingTypography}
                        />
                      </div>
                    )}
                    {activeTab === 'saved' && (
                      <SavedDesignsPanel onLoadDesign={handleLoadDesign} />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Main Canvas Area */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl glass-card overflow-hidden shadow-2xl">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-2 border-b border-border/50 bg-card/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="h-8 w-8"
                  >
                    {showSidebar ? (
                      <PanelLeftClose className="w-4 h-4" />
                    ) : (
                      <PanelLeft className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex-1">
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
                  </div>
                </div>

                {/* Split View: Canvas + Chat + Generated UI */}
                <div className="flex h-[500px] gap-4 p-2">
                  {/* Canvas */}
                  <div 
                    ref={canvasContainerRef}
                    className="w-1/3 rounded-xl border border-border/50 relative overflow-hidden bg-background"
                  >
                    <CanvasRenderer
                      elements={state.elements}
                      currentElement={state.currentElement}
                      onStartDrawing={startDrawing}
                      onContinueDrawing={continueDrawing}
                      onStopDrawing={stopDrawing}
                    />

                    {/* Empty state */}
                    {state.elements.length === 0 && !state.currentElement && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Wand2 className="w-6 h-6 text-primary/50" />
                          </div>
                          <p className="text-muted-foreground text-sm mb-1">Draw your wireframe</p>
                          <p className="text-muted-foreground/60 text-xs">Sketch your UI layout</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Interface */}
                  <div className="w-1/3 rounded-xl border border-border/50 overflow-hidden bg-background">
                    <DesignChat
                      messages={chatMessages}
                      onSendMessage={handleChatMessage}
                      isGenerating={isGeneratingUI}
                      hasSketch={state.elements.length > 0}
                      hasDesignSystem={!!(typography || colorPalette)}
                    />
                  </div>

                  {/* Generated UI Preview */}
                  <div className="w-1/3 rounded-xl border border-border/50 overflow-hidden bg-background">
                    <GeneratedUIPreview 
                      generatedUI={generatedUI} 
                      isLoading={isGeneratingUI}
                      onRegenerateArea={handleRegenerateArea}
                    />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-card/30">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{state.elements.length} elements</span>
                    {typography && (
                      <>
                        <span className="w-px h-4 bg-border" />
                        <span className="flex items-center gap-1 text-primary">
                          <Sparkles className="w-3 h-3" />
                          Typography
                        </span>
                      </>
                    )}
                    {colorPalette && (
                      <>
                        <span className="w-px h-4 bg-border" />
                        <span className="flex items-center gap-1 text-primary">
                          <Palette className="w-3 h-3" />
                          Colors
                        </span>
                      </>
                    )}
                    {chatMessages.length > 0 && (
                      <>
                        <span className="w-px h-4 bg-border" />
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          {chatMessages.length} messages
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href="/auth">
                        <Sparkles className="w-4 h-4" />
                        Sign in to Save & Export
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AICanvasDemo;
