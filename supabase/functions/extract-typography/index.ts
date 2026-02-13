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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
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

    console.log('Extracting typography from mood board image...');

    const systemPrompt = `You are an expert design system analyst. Analyze the provided mood board image and extract a comprehensive typography system AND color palette.

Examine the visual patterns including:
- Font styles and families (serif, sans-serif, display, monospace)
- Typography hierarchy (headings, subheadings, body text, captions)
- Spacing and line height aesthetics
- Overall visual weight and character
- Color patterns, dominant colors, accent colors, and color harmony

Return a structured JSON design system following this EXACT schema:
{
  "typography": {
    "fonts": {
      "heading": { "family": "string", "fallback": "string", "description": "string" },
      "body": { "family": "string", "fallback": "string", "description": "string" },
      "accent": { "family": "string", "fallback": "string", "description": "string" }
    },
    "scale": {
      "h1": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "h2": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "h3": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "h4": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "body": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "bodySmall": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "caption": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" },
      "button": { "size": "string", "weight": "number", "lineHeight": "string", "letterSpacing": "string", "usage": "string" }
    },
    "colors": {
      "textPrimary": "string (hex)",
      "textSecondary": "string (hex)",
      "textMuted": "string (hex)",
      "accent": "string (hex)",
      "background": "string (hex)"
    },
    "aesthetic": "string (brief description of the overall typographic feel)"
  },
  "colorPalette": {
    "primary": { "hex": "string", "name": "string", "usage": "string" },
    "secondary": { "hex": "string", "name": "string", "usage": "string" },
    "accent": { "hex": "string", "name": "string", "usage": "string" },
    "background": { "hex": "string", "name": "string", "usage": "string" },
    "surface": { "hex": "string", "name": "string", "usage": "string" },
    "text": { "hex": "string", "name": "string", "usage": "string" },
    "muted": { "hex": "string", "name": "string", "usage": "string" },
    "border": { "hex": "string", "name": "string", "usage": "string" },
    "harmony": "string (describe the color harmony: complementary, analogous, triadic, etc.)",
    "mood": "string (describe the emotional feel of the palette)"
  }
}

Use Google Fonts names where possible. Be specific about weights (100-900) and use CSS-standard values.
For colors, use hex values and provide descriptive names.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { 
                type: 'image_url', 
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              },
              { 
                type: 'text', 
                text: 'Analyze this mood board and extract a complete typography system. Return only valid JSON.' 
              }
            ]
          }
        ],
        temperature: 0.3,
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
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from the response
    let typography;
    try {
      // Try to parse the entire content as JSON first
      typography = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        typography = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the content
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          typography = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error('Could not parse typography data from AI response');
        }
      }
    }

    console.log('Typography extraction successful');
    return new Response(
      JSON.stringify({ success: true, data: typography }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting typography:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract typography';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
