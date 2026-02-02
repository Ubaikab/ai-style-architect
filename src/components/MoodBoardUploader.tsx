import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodBoardUploaderProps {
  projectId: string;
  onImagesUploaded: () => void;
}

export function MoodBoardUploader({
  projectId,
  onImagesUploaded,
}: MoodBoardUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be signed in to upload images",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      let successCount = 0;

      for (const file of acceptedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("mood-boards")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        // Save to database
        const { error: dbError } = await supabase
          .from("mood_board_images")
          .insert({
            project_id: projectId,
            user_id: user.id,
            storage_path: fileName,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          });

        if (dbError) {
          console.error("Database error:", dbError);
          // Try to clean up the uploaded file
          await supabase.storage.from("mood-boards").remove([fileName]);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${successCount} image${successCount > 1 ? "s" : ""}.`,
        });
        onImagesUploaded();
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload images. Please try again.",
          variant: "destructive",
        });
      }

      setUploading(false);
    },
    [projectId, onImagesUploaded, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "glass-card border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
        isDragActive && "border-primary bg-primary/5",
        uploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-4">
        {uploading ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Uploading images...</p>
          </>
        ) : isDragActive ? (
          <>
            <ImageIcon className="w-12 h-12 text-primary" />
            <p className="text-primary font-medium">Drop your images here</p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                Drag & drop images or click to browse
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, WebP up to 10MB each (max 10 files)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
