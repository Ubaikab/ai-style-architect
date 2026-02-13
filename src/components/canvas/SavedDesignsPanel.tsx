import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Trash2, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SavedDesign, DrawElement, TypographySystem, ColorPalette, GeneratedUI } from './types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SavedDesignsPanelProps {
  onLoadDesign: (design: {
    elements: DrawElement[];
    typography: TypographySystem | null;
    colorPalette: ColorPalette | null;
    generatedUI: GeneratedUI | null;
  }) => void;
}

const SavedDesignsPanel = ({ onLoadDesign }: SavedDesignsPanelProps) => {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDesigns();
    } else {
      setDesigns([]);
      setLoading(false);
    }
  }, [user]);

  const fetchDesigns = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our types
      const transformedData = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        sketch_data: item.sketch_data as unknown as DrawElement[] | null,
        typography_system: item.typography_system as unknown as TypographySystem | null,
        color_palette: item.color_palette as unknown as ColorPalette | null,
        generated_ui: item.generated_ui as unknown as GeneratedUI | null,
        thumbnail_url: item.thumbnail_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setDesigns(transformedData);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('saved_designs')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setDesigns((prev) => prev.filter((d) => d.id !== deleteId));
      toast({
        title: 'Design deleted',
        description: 'Your design has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete design',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleLoad = (design: SavedDesign) => {
    onLoadDesign({
      elements: (design.sketch_data as DrawElement[]) || [],
      typography: design.typography_system as TypographySystem | null,
      colorPalette: design.color_palette as ColorPalette | null,
      generatedUI: design.generated_ui as GeneratedUI | null,
    });
    toast({
      title: 'Design loaded',
      description: `"${design.name}" has been loaded to the canvas.`,
    });
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">Sign in to view saved designs</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No saved designs yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Create a design and save it to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto p-4 space-y-2">
        {designs.map((design, index) => (
          <motion.div
            key={design.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative"
          >
            <Button
              variant="ghost"
              className="w-full h-auto p-3 justify-start text-left rounded-lg border border-border/50 hover:border-primary/50 transition-all"
              onClick={() => handleLoad(design)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{design.name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(design.created_at).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(design.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete design?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your saved design.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedDesignsPanel;
