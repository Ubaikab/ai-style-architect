import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Palette, Clock, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  style_guide: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
  style?: React.CSSProperties;
}

export function ProjectCard({ project, style }: ProjectCardProps) {
  const navigate = useNavigate();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Completed", className: "status-completed" };
      case "processing":
        return { label: "Processing", className: "status-processing" };
      case "failed":
        return { label: "Failed", className: "status-failed" };
      default:
        return { label: "Draft", className: "status-draft" };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  // Extract colors from style guide if available
  const previewColors = project.style_guide?.colors as Array<{ hex: string }> | undefined;

  return (
    <Card 
      className="glass-card group cursor-pointer hover:border-primary/50 transition-all duration-300 animate-fade-in overflow-hidden"
      style={style}
      onClick={() => navigate(`/project/${project.id}`)}
    >
      {/* Color preview strip */}
      <div className="h-2 w-full flex">
        {previewColors?.slice(0, 6).map((color, i) => (
          <div 
            key={i} 
            className="flex-1" 
            style={{ backgroundColor: color.hex }}
          />
        )) || (
          <div className="flex-1 bg-gradient-to-r from-primary to-secondary opacity-30" />
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <Badge className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground">
            {project.status === "completed" ? "View style guide" : "Continue editing"}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
