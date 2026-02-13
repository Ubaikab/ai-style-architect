import { useState } from 'react';
import { Save, Check, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DrawElement, TypographySystem, ColorPalette, GeneratedUI } from './types';
import { useNavigate } from 'react-router-dom';

interface SaveDesignButtonProps {
  elements: DrawElement[];
  typography: TypographySystem | null;
  colorPalette: ColorPalette | null;
  generatedUI: GeneratedUI | null;
}

const SaveDesignButton = ({
  elements,
  typography,
  colorPalette,
  generatedUI,
}: SaveDesignButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [designName, setDesignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        user_id: user.id,
        name: designName || 'Untitled Design',
        sketch_data: elements.length > 0 ? JSON.parse(JSON.stringify(elements)) : null,
        typography_system: typography ? JSON.parse(JSON.stringify(typography)) : null,
        color_palette: colorPalette ? JSON.parse(JSON.stringify(colorPalette)) : null,
        generated_ui: generatedUI ? JSON.parse(JSON.stringify(generatedUI)) : null,
      };
      const { error } = await supabase.from('saved_designs').insert(insertData);

      if (error) throw error;

      setSaved(true);
      toast({
        title: 'Design saved!',
        description: 'Your design has been saved to your account.',
      });

      setTimeout(() => {
        setIsOpen(false);
        setSaved(false);
        setDesignName('');
      }, 1500);
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save design',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => navigate('/auth')}
      >
        <LogIn className="w-4 h-4" />
        Sign in to save
      </Button>
    );
  }

  const hasContent = elements.length > 0 || typography || generatedUI;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!hasContent}
        >
          <Save className="w-4 h-4" />
          Save
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Design</DialogTitle>
          <DialogDescription>
            Save your current design to access it later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input
            placeholder="Design name (optional)"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            disabled={isSaving}
          />
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>This will save:</p>
            <ul className="list-disc list-inside space-y-1">
              {elements.length > 0 && <li>{elements.length} canvas elements</li>}
              {typography && <li>Typography system</li>}
              {colorPalette && <li>Color palette</li>}
              {generatedUI && <li>Generated UI component</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            ) : isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : (
              'Save Design'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveDesignButton;
