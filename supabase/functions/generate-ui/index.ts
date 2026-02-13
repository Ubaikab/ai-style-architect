import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sketchBase64, moodboardBase64, colorPalette, typography, prompt, conversationHistory } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating visual UI from sketch with prompt:', prompt);

    // Build context from design system
    let designContext = '';
    
    if (colorPalette) {
      designContext += `\nColor Palette to use:
- Primary: ${colorPalette.primary.hex} (${colorPalette.primary.usage})
- Secondary: ${colorPalette.secondary.hex} (${colorPalette.secondary.usage})
- Accent: ${colorPalette.accent.hex} (${colorPalette.accent.usage})
- Background: ${colorPalette.background.hex}
- Surface: ${colorPalette.surface.hex}
- Text: ${colorPalette.text.hex}
- Muted: ${colorPalette.muted.hex}
- Border: ${colorPalette.border.hex}
Color mood: ${colorPalette.mood}, Harmony: ${colorPalette.harmony}`;
    }

    if (typography?.typography) {
      designContext += `\nTypography to use:
- Headings: ${typography.typography.fonts.heading.family}
- Body: ${typography.typography.fonts.body.family}
- Aesthetic: ${typography.typography.aesthetic}`;
    }

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation:\n' + 
        conversationHistory.map((msg: { role: string; content: string }) => 
          `${msg.role}: ${msg.content}`
        ).join('\n');
    }

    // Image generation prompt
    const imagePrompt = `Create a beautiful, modern, high-fidelity UI design based on this wireframe sketch.

User's request: ${prompt}
${designContext}
${conversationContext}

Transform the rough wireframe into a polished, professional UI mockup. Apply the color palette and typography from the design system. Make it look like a real, production-ready interface with:
- Clean layouts with proper spacing and alignment
- Modern UI elements (buttons, cards, inputs with rounded corners)
- Subtle shadows and depth
- Professional visual hierarchy
- The exact colors from the provided palette
- Cohesive, beautiful aesthetic matching the mood board style

Output a single complete UI screen design.`;

    // Use image generation model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          { 
            role: 'user', 
            content: [
              ...(sketchBase64 ? [{
                type: 'image_url', 
                image_url: { url: `data:image/png;base64,${sketchBase64}` }
              }] : []),
              ...(moodboardBase64 ? [{
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${moodboardBase64}` }
              }] : []),
              { 
                type: 'text', 
                text: imagePrompt
              }
            ]
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits required. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data).slice(0, 500));
    
    // Extract image from response
    const choice = data.choices?.[0];
    const message = choice?.message;
    
    let imageBase64 = '';
    let description = '';
    
    // Check for images array format (Gemini image generation response)
    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images) {
        if (img.type === 'image_url' && img.image_url?.url) {
          const dataUrl = img.image_url.url;
          if (dataUrl.startsWith('data:image')) {
            imageBase64 = dataUrl.split(',')[1] || '';
          } else {
            imageBase64 = dataUrl;
          }
          break;
        }
      }
    }
    
    // Handle content-based response formats as fallback
    if (!imageBase64 && message?.content) {
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'image_url' && part.image_url?.url) {
            const dataUrl = part.image_url.url;
            if (dataUrl.startsWith('data:image')) {
              imageBase64 = dataUrl.split(',')[1] || '';
            } else {
              imageBase64 = dataUrl;
            }
          } else if (part.type === 'text') {
            description = part.text || '';
          } else if (part.inline_data?.data) {
            imageBase64 = part.inline_data.data;
          }
        }
      } else if (typeof message.content === 'string') {
        if (message.content.startsWith('data:image')) {
          imageBase64 = message.content.split(',')[1] || '';
        } else {
          description = message.content;
        }
      }
    }

    if (!imageBase64) {
      console.error('No image in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Failed to generate image. Please try a different prompt.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedUI = {
      imageBase64,
      imageUrl: `data:image/png;base64,${imageBase64}`,
      prompt,
      description: description || 'UI generated from your sketch',
      designNotes: [
        colorPalette ? `Applied ${colorPalette.mood} color palette` : 'No color palette applied',
        typography ? `Using ${typography.typography.fonts.heading.family} for headings` : 'Default typography',
        'Generated as high-fidelity mockup'
      ]
    };

    console.log('UI generation successful');
    return new Response(
      JSON.stringify({ success: true, data: generatedUI }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating UI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate UI';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
