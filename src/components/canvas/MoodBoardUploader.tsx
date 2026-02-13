import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MoodBoardUploaderProps {
  onImageUploaded: (base64: string) => void;
  isLoading: boolean;
}

const MoodBoardUploader = ({ onImageUploaded, isLoading }: MoodBoardUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      // Extract base64 data without the data URL prefix
      const base64 = result.split(',')[1];
      onImageUploaded(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageUploaded, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearImage = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Upload Mood Board</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to select
              </p>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            src={preview}
            alt="Mood board preview"
            className="w-full h-48 object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing...</span>
              </div>
            </div>
          )}
          {!isLoading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearImage}
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Mood board uploaded</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodBoardUploader;
