import { useState, useEffect, useMemo } from "react";
import { Loader2, AlertCircle, Code2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LivePreviewProps {
  code: string | null;
  styleGuide: Record<string, unknown> | null;
}

export function LivePreview({ code, styleGuide }: LivePreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  // Generate CSS from style guide
  const generatedCSS = useMemo(() => {
    if (!styleGuide) return "";

    let css = `:root {\n`;

    // Add colors as CSS variables
    const colors = styleGuide.colors as Array<{
      name: string;
      colors: Array<{ name: string; hex: string }>;
    }> | undefined;

    if (colors) {
      colors.forEach((section) => {
        section.colors?.forEach((color) => {
          const varName = `--color-${section.name.toLowerCase()}-${color.name.toLowerCase()}`.replace(/\s+/g, "-");
          css += `  ${varName}: ${color.hex};\n`;
        });
      });
    }

    // Add typography as CSS variables
    const typography = styleGuide.typography as Array<{
      name: string;
      styles: Array<{
        name: string;
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineHeight: string;
      }>;
    }> | undefined;

    if (typography) {
      typography.forEach((section) => {
        section.styles?.forEach((style) => {
          const baseName = `--font-${style.name.toLowerCase()}`.replace(/\s+/g, "-");
          css += `  ${baseName}-family: ${style.fontFamily};\n`;
          css += `  ${baseName}-size: ${style.fontSize};\n`;
          css += `  ${baseName}-weight: ${style.fontWeight};\n`;
          css += `  ${baseName}-line-height: ${style.lineHeight};\n`;
        });
      });
    }

    css += `}\n`;

    return css;
  }, [styleGuide]);

  // Create a safe HTML wrapper for the preview
  const previewHTML = useMemo(() => {
    if (!code) return null;

    // Transform the React code to something renderable
    // This is a simplified approach - in production you'd use a proper transpiler
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${generatedCSS}
    body {
      font-family: 'Inter', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background: #0a0a0b;
      color: white;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel">
    ${code}
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(GeneratedUI || (() => <div>Component not found</div>)));
  </script>
</body>
</html>
    `;

    return html;
  }, [code, generatedCSS]);

  if (!code) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Preview Available</h3>
          <p className="text-muted-foreground text-sm">
            Create a wireframe on the canvas and click "Generate UI" to see your
            design come to life.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview toolbar */}
      <div className="h-10 border-b border-border/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Live Preview</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              className={cn(
                "px-3 py-1 text-xs transition-colors",
                !showCode ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => setShowCode(false)}
            >
              Preview
            </button>
            <button
              className={cn(
                "px-3 py-1 text-xs transition-colors",
                showCode ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => setShowCode(true)}
            >
              Code
            </button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(code);
          }}
        >
          Copy Code
        </Button>
      </div>

      {/* Preview/Code content */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Preview Error</h3>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={() => setShowCode(true)}>
                View Generated Code
              </Button>
            </div>
          </div>
        ) : showCode ? (
          <ScrollArea className="h-full">
            <pre className="p-4 text-sm font-mono text-muted-foreground whitespace-pre-wrap">
              <code>{code}</code>
            </pre>
          </ScrollArea>
        ) : previewHTML ? (
          <iframe
            srcDoc={previewHTML}
            className="w-full h-full border-0 bg-white"
            title="Generated UI Preview"
            sandbox="allow-scripts"
            onError={() => setError("Failed to render preview")}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
