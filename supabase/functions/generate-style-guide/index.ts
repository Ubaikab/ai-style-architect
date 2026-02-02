import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Style guide schema definition for validation
const validateStyleGuide = (data: unknown): boolean => {
  if (!data || typeof data !== "object") return false;
  const guide = data as Record<string, unknown>;

  // Check theme
  if (!guide.theme || typeof guide.theme !== "object") return false;
  const theme = guide.theme as Record<string, unknown>;
  if (typeof theme.name !== "string" || typeof theme.description !== "string")
    return false;

  // Check colors array
  if (!Array.isArray(guide.colors)) return false;
  for (const color of guide.colors) {
    if (typeof color !== "object" || !color) return false;
    const c = color as Record<string, unknown>;
    if (typeof c.name !== "string" || typeof c.hex !== "string" || typeof c.usage !== "string")
      return false;
    // Validate hex format
    if (!/^#[0-9A-Fa-f]{6}$/.test(c.hex as string)) return false;
  }

  // Check typography array
  if (!Array.isArray(guide.typography)) return false;
  for (const type of guide.typography) {
    if (typeof type !== "object" || !type) return false;
    const t = type as Record<string, unknown>;
    if (
      typeof t.name !== "string" ||
      typeof t.fontFamily !== "string" ||
      typeof t.fontSize !== "string" ||
      typeof t.fontWeight !== "string" ||
      typeof t.lineHeight !== "string" ||
      typeof t.usage !== "string"
    )
      return false;
  }

  return true;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, imageUrls } = await req.json();

    if (!projectId || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing projectId or imageUrls" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to identify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.credits < 1) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating style guide for project ${projectId} with ${imageUrls.length} images`);

    // Prepare the prompt with image analysis
    const systemPrompt = `You are an expert design system analyst. Analyze the provided mood board images and generate a comprehensive style guide. 

You MUST respond with valid JSON matching this exact schema:
{
  "theme": {
    "name": "string - creative name for this design theme",
    "description": "string - 2-3 sentence description of the overall design direction",
    "mood": ["array", "of", "mood", "keywords"]
  },
  "colors": [
    {
      "name": "string - descriptive name like 'Primary Coral' or 'Deep Navy'",
      "hex": "#RRGGBB - valid 6-digit hex color",
      "usage": "string - when to use this color"
    }
  ],
  "typography": [
    {
      "name": "string - like 'Heading 1' or 'Body Text'",
      "fontFamily": "string - font family name",
      "fontSize": "string - like '48px' or '2rem'",
      "fontWeight": "string - like '700' or 'bold'",
      "lineHeight": "string - like '1.2' or '1.5'",
      "usage": "string - when to use this style"
    }
  ],
  "recommendations": ["array", "of", "design", "recommendations"]
}

Extract 5-8 colors from the images. Include at least 4 typography styles (heading, subheading, body, caption). Be specific and practical in your recommendations.`;

    // Build the message content with images
    const imageContent = imageUrls.map((url: string) => ({
      type: "image_url",
      image_url: { url },
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze these mood board images and generate a complete style guide following the schema exactly. Respond with only valid JSON, no markdown or code blocks." },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response - handle potential markdown wrapping
    let styleGuide;
    try {
      // Try to extract JSON from potential markdown code blocks
      let jsonString = content.trim();
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.slice(0, -3);
      }
      jsonString = jsonString.trim();
      
      styleGuide = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the style guide schema
    if (!validateStyleGuide(styleGuide)) {
      console.error("Invalid style guide schema:", styleGuide);
      throw new Error("AI response does not match required schema");
    }

    console.log("Style guide validated, saving to database...");

    // Deduct credit
    const { error: creditError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("user_id", user.id);

    if (creditError) {
      console.error("Failed to deduct credit:", creditError);
    }

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      project_id: projectId,
      amount: -1,
      type: "generation",
      description: "Style guide generation",
    });

    // Update project with style guide
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        style_guide: styleGuide,
        status: "completed",
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update project:", updateError);
      throw new Error("Failed to save style guide");
    }

    console.log("Style guide saved successfully!");

    return new Response(
      JSON.stringify({ success: true, styleGuide }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate style guide error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
