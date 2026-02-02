import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MoodBoardUploader } from "@/components/MoodBoardUploader";
import { StyleGuideDisplay } from "@/components/StyleGuideDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  style_guide: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface MoodBoardImage {
  id: string;
  storage_path: string;
  file_name: string;
}

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<MoodBoardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchProject = useCallback(async () => {
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
  }, [id, navigate]);

  const fetchImages = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("mood_board_images")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      setImages(data as MoodBoardImage[]);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchImages()]);
      setLoading(false);
    };

    if (user && id) {
      loadData();
    }
  }, [user, id, fetchProject, fetchImages]);

  const handleImagesUploaded = () => {
    fetchImages();
  };

  const handleDeleteImage = async (imageId: string, storagePath: string) => {
    const { error: storageError } = await supabase.storage
      .from("mood-boards")
      .remove([storagePath]);

    if (storageError) {
      console.error("Error deleting from storage:", storageError);
    }

    const { error: dbError } = await supabase
      .from("mood_board_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } else {
      fetchImages();
    }
  };

  const handleGenerate = async () => {
    if (!profile || profile.credits < 1) {
      toast({
        title: "Insufficient credits",
        description: "You need at least 1 credit to generate a style guide.",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "No images",
        description: "Please upload at least one mood board image.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    // Update project status
    await supabase
      .from("projects")
      .update({ status: "processing" })
      .eq("id", id);

    try {
      // Get public URLs for all images
      const imageUrls = images.map((img) => {
        const { data } = supabase.storage
          .from("mood-boards")
          .getPublicUrl(img.storage_path);
        return data.publicUrl;
      });

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke("generate-style-guide", {
        body: { projectId: id, imageUrls },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Style guide generated!",
        description: "Your AI-powered design system is ready.",
      });

      // Refresh project and profile
      await Promise.all([fetchProject(), refreshProfile()]);
    } catch (error) {
      console.error("Generation error:", error);
      
      // Update project status to failed
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", id);

      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });

      fetchProject();
    }

    setGenerating(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          {project.status !== "completed" && (
            <Button
              variant="gradient"
              onClick={handleGenerate}
              disabled={generating || images.length === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Style Guide
                </>
              )}
            </Button>
          )}
        </div>

        {project.status === "completed" && project.style_guide ? (
          <StyleGuideDisplay styleGuide={project.style_guide} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold mb-2">
                  Mood Board Images
                </h2>
                <p className="text-muted-foreground text-sm">
                  Upload images that represent your desired design direction.
                  The AI will analyze colors, patterns, and visual elements.
                </p>
              </div>

              <MoodBoardUploader
                projectId={project.id}
                onImagesUploaded={handleImagesUploaded}
              />
            </div>

            {/* Preview section */}
            <div className="space-y-6">
              <h2 className="text-xl font-display font-semibold">
                Uploaded Images ({images.length})
              </h2>

              {images.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No images uploaded yet. Add some mood board images to get
                    started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image) => {
                    const { data } = supabase.storage
                      .from("mood-boards")
                      .getPublicUrl(image.storage_path);

                    return (
                      <div
                        key={image.id}
                        className="relative group rounded-lg overflow-hidden aspect-square glass-card"
                      >
                        <img
                          src={data.publicUrl}
                          alt={image.file_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() =>
                              handleDeleteImage(image.id, image.storage_path)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
