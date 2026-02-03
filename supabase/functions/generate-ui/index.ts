import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WireframeElement {
  type: string;
  name: string;
  dimensions: { width: number; height: number };
  style: Record<string, unknown>;
  layout?: {
    direction: string;
    gap: number;
    padding: { top: number; right: number; bottom: number; left: number };
    alignItems: string;
    justifyContent: string;
  };
  text?: string;
  placeholder?: string;
  children: WireframeElement[];
}

interface StyleGuide {
  theme: { mode: string; name: string };
  colors: {
    name: string;
    colors: { name: string; hex: string; usage: string }[];
  }[];
  typography: {
    name: string;
    styles: {
      name: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      usage: string;
    }[];
  }[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wireframe, styleGuide, projectId } = await req.json();

    if (!wireframe || !styleGuide) {
      return new Response(
        JSON.stringify({ error: "Wireframe and style guide are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompt for AI
    const systemPrompt = `You are an expert React developer. Your task is to transform a wireframe structure into beautiful, responsive React components using Tailwind CSS.

You will receive:
1. A structured wireframe layout (JSON) describing UI elements and their hierarchy
2. A design system with colors and typography extracted from mood boards

Your output must be a complete, self-contained React component that:
- Uses the exact colors and typography from the design system
- Maintains the layout structure from the wireframe
- Applies proper Tailwind CSS classes for styling
- Is responsive and mobile-friendly
- Uses semantic HTML elements
- Follows React best practices

The component should be beautiful and production-ready, not a basic wireframe representation.`;

    const userPrompt = `Transform this wireframe into a beautiful React component:

## Wireframe Structure:
${JSON.stringify(wireframe, null, 2)}

## Design System:

### Colors:
${JSON.stringify(styleGuide.colors, null, 2)}

### Typography:
${JSON.stringify(styleGuide.typography, null, 2)}

### Theme:
${JSON.stringify(styleGuide.theme, null, 2)}

Generate a single React functional component that:
1. Implements the exact layout structure from the wireframe
2. Uses the color palette from the design system (apply as inline styles or CSS custom properties)
3. Uses the typography styles appropriately
4. Makes it visually stunning with gradients, shadows, and modern styling
5. Ensures it's fully responsive

Return ONLY the React component code, no explanations. The component should be named "GeneratedUI" and export as default.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedCode = aiResponse.choices?.[0]?.message?.content;

    if (!generatedCode) {
      throw new Error("No code generated from AI");
    }

    // Extract just the code block if wrapped in markdown
    let cleanCode = generatedCode;
    const codeBlockMatch = generatedCode.match(/```(?:jsx|tsx|javascript|typescript)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanCode = codeBlockMatch[1].trim();
    }

    return new Response(
      JSON.stringify({
        success: true,
        code: cleanCode,
        projectId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate UI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
