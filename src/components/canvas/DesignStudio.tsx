import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Home, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import MoodboardSection from './sections/MoodboardSection';
import CanvasSection from './sections/CanvasSection';
import DesignAssistantSection from './sections/DesignAssistantSection';
import VisionSection from './sections/VisionSection';
import { TypographySystem, ColorPalette, GeneratedUI } from './types';
import { CanvasElement } from './types/elements';

const DesignStudio = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Design System State
  const [typography, setTypography] = useState<TypographySystem | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [moodboardBase64, setMoodboardBase64] = useState<string | null>(null);

  // Canvas State
  const [canvasData, setCanvasData] = useState<{
    elements: Record<string, CanvasElement>;
    rootIds: string[];
  } | null>(null);

  // Generated UI State
  const [generatedUI, setGeneratedUI] = useState<GeneratedUI | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCanvasChange = useCallback((json: { elements: Record<string, CanvasElement>; rootIds: string[] }) => {
    setCanvasData(json);
  }, []);

  const handleUIGenerated = useCallback((ui: GeneratedUI) => {
    setGeneratedUI(ui);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">Design Studio</h1>
                <p className="text-xs text-muted-foreground">From wireframe to production UI</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <StepIndicator step={1} label="Moodboard" active={!moodboardBase64} complete={!!moodboardBase64} />
              <div className="w-8 h-px bg-border" />
              <StepIndicator step={2} label="Canvas" active={!!moodboardBase64 && !canvasData?.rootIds.length} complete={!!canvasData?.rootIds.length} />
              <div className="w-8 h-px bg-border" />
              <StepIndicator step={3} label="Generate" active={!!canvasData?.rootIds.length && !generatedUI} complete={!!generatedUI} />
              <div className="w-8 h-px bg-border" />
              <StepIndicator step={4} label="Preview" active={!!generatedUI} complete={false} />
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 4 Vertical Sections */}
      <main>
        {/* Section 1: Moodboard */}
        <MoodboardSection
          typography={typography}
          colorPalette={colorPalette}
          onTypographyExtracted={setTypography}
          onColorPaletteExtracted={setColorPalette}
          onMoodboardUploaded={setMoodboardBase64}
        />

        {/* Section 2: Canvas */}
        <CanvasSection onCanvasChange={handleCanvasChange} />

        {/* Section 3: Design Assistant */}
        <DesignAssistantSection
          canvasData={canvasData}
          typography={typography}
          colorPalette={colorPalette}
          moodboardBase64={moodboardBase64}
          onUIGenerated={handleUIGenerated}
        />

        {/* Section 4: Vision/Preview */}
        <VisionSection generatedUI={generatedUI} isLoading={isGenerating} />
      </main>
    </div>
  );
};

// Step Indicator Component
const StepIndicator = ({ step, label, active, complete }: { step: number; label: string; active: boolean; complete: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
        complete
          ? 'bg-primary text-primary-foreground'
          : active
          ? 'bg-primary/20 text-primary border border-primary'
          : 'bg-secondary text-muted-foreground'
      }`}
    >
      {complete ? '✓' : step}
    </div>
    <span className={`text-xs ${active || complete ? 'text-foreground' : 'text-muted-foreground'}`}>
      {label}
    </span>
  </div>
);

export default DesignStudio;
