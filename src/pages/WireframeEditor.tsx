import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CanvasToolbar, 
  CanvasStage, 
  PropertiesPanel, 
  LayersPanel 
} from "@/components/canvas";
import { LivePreview } from "@/components/canvas/LivePreview";
import { useCanvasStore } from "@/stores/canvasStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  style_guide: Record<string, unknown> | null;
}

export default function WireframeEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("canvas");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const { 
    zoom, 
    setZoom, 
    resetView, 
    elements, 
    getStructuredLayout 
  } = useCanvasStore();

  // Resize canvas to fit container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Fetch project
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching project:", error);
        navigate("/dashboard");
        return;
      }

      setProject(data as Project);
      setLoading(false);
    };

    if (user && id) {
      fetchProject();
    }
  }, [user, id, navigate]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleGenerateUI = useCallback(async () => {
    if (!project?.style_guide) {
      toast({
        title: "No style guide",
        description: "Please generate a style guide first before creating UI.",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(elements).length === 0) {
      toast({
        title: "Empty canvas",
        description: "Please add some elements to the canvas first.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const wireframe = getStructuredLayout();

      const { data, error } = await supabase.functions.invoke("generate-ui", {
        body: {
          wireframe,
          styleGuide: project.style_guide,
          projectId: project.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedCode(data.code);
      setActiveTab("preview");

      toast({
        title: "UI Generated!",
        description: "Your wireframe has been transformed into React code.",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }, [project, elements, getStructuredLayout, toast]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  const hasStyleGuide = Boolean(project.style_guide);
  const hasElements = Object.keys(elements).length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      {/* Editor Header */}
      <div className="h-14 border-b border-border/50 bg-card/50 backdrop-blur flex items-center px-4 gap-4 mt-16">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/project/${id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <h1 className="font-semibold">{project.name}</h1>
          <p className="text-xs text-muted-foreground">Wireframe Editor</p>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(zoom - 0.1)}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(zoom + 0.1)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={resetView}
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        {/* Generate button */}
        <Button
          variant="gradient"
          onClick={handleGenerateUI}
          disabled={generating || !hasStyleGuide || !hasElements}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate UI
            </>
          )}
        </Button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbar */}
        <CanvasToolbar />

        {/* Center: Canvas/Preview Tabs */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border/50 px-4">
              <TabsList className="h-10 bg-transparent">
                <TabsTrigger value="canvas" className="data-[state=active]:bg-muted">
                  Canvas
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-muted">
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="canvas" className="flex-1 m-0 p-0">
              <div className="flex h-full">
                {/* Layers Panel */}
                <LayersPanel />

                {/* Canvas */}
                <div ref={containerRef} className="flex-1 bg-background overflow-hidden">
                  <CanvasStage width={canvasSize.width} height={canvasSize.height} />
                </div>

                {/* Properties Panel */}
                <PropertiesPanel />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0 p-0">
              <LivePreview code={generatedCode} styleGuide={project.style_guide} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Status bar */}
      {!hasStyleGuide && (
        <div className="h-10 bg-warning/10 border-t border-warning/20 flex items-center justify-center px-4 gap-2">
          <span className="text-sm text-warning">
            No style guide found. Go back to the project to generate one first.
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-warning"
            onClick={() => navigate(`/project/${id}`)}
          >
            Generate Style Guide →
          </Button>
        </div>
      )}
    </div>
  );
}
