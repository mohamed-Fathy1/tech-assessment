import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, Layers } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    _count: {
      tasks: number;
    };
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Random pastel backgrounds for project cards
  const bgColors = [
    "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
    "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100",
    "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100",
    "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100",
    "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100",
  ];

  // Create a hash from project name to consistently select same color for same project
  const hashCode = project.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColorIndex = hashCode % bgColors.length;
  const bgColor = bgColors[bgColorIndex];

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block group"
    >
      <Card
        className={`h-[95px] transition-all duration-300 ${bgColor} hover:shadow-md hover:translate-y-[-2px] relative p-2.5`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <h3 className="text-sm font-medium tracking-tight truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 group-hover:line-clamp-2">
              {project.description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/30 mt-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
            </div>
            <Badge
              variant="secondary"
              className="flex items-center h-4 px-1.5"
            >
              <Layers className="h-3 w-3 mr-0.5" />
              <span className="text-xs">{project._count.tasks}</span>
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
