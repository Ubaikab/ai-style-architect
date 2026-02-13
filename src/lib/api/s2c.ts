import { supabase } from '@/integrations/supabase/client';
import { TypographySystem, GeneratedUI, DesignChatMessage, ColorPalette } from '@/components/canvas/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const s2cApi = {
  async extractTypography(imageBase64: string): Promise<ApiResponse<TypographySystem>> {
    try {
      const { data, error } = await supabase.functions.invoke('extract-typography', {
        body: { imageBase64 },
      });

      if (error) {
        console.error('Typography extraction error:', error);
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      return { success: true, data: data.data };
    } catch (err) {
      console.error('Typography API error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to extract typography' 
      };
    }
  },

  async generateUI(
    sketchBase64: string, 
    prompt: string,
    options?: {
      moodboardBase64?: string;
      typography?: TypographySystem;
      colorPalette?: ColorPalette;
      conversationHistory?: DesignChatMessage[];
    }
  ): Promise<ApiResponse<GeneratedUI>> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ui', {
        body: { 
          sketchBase64, 
          prompt,
          moodboardBase64: options?.moodboardBase64,
          typography: options?.typography,
          colorPalette: options?.colorPalette,
          conversationHistory: options?.conversationHistory?.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
      });

      if (error) {
        console.error('UI generation error:', error);
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      return { success: true, data: data.data };
    } catch (err) {
      console.error('UI API error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to generate UI' 
      };
    }
  },
};
