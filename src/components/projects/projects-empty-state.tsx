import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderPlus, Settings2, Users, Layers, CalendarDays } from "lucide-react";

export function ProjectsEmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10 shadow-sm">
          <FolderPlus className="h-10 w-10 text-primary mx-auto" />

          <div className="absolute -right-2 -top-2 rounded-full bg-blue-100 p-1 border border-blue-200 animate-pulse">
            <Users className="h-2.5 w-2.5 text-blue-700" />
          </div>

          <div className="absolute -left-2 top-1/2 rounded-full bg-green-100 p-1 border border-green-200 animate-pulse delay-200">
            <Settings2 className="h-2.5 w-2.5 text-green-700" />
          </div>

          <div className="absolute -bottom-2 -right-2 rounded-full bg-purple-100 p-1 border border-purple-200 animate-pulse delay-300">
            <CalendarDays className="h-2.5 w-2.5 text-purple-700" />
          </div>

          <div className="absolute -left-2 -bottom-2 rounded-full bg-amber-100 p-1 border border-amber-200 animate-pulse delay-100">
            <Layers className="h-2.5 w-2.5 text-amber-700" />
          </div>
        </div>
      </div>

      <h2 className="mt-4 text-lg font-bold tracking-tight">No projects yet</h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
        Create your first project to begin organizing tasks and tracking work for your team.
      </p>

      <div className="mt-4 space-y-1.5">
        <Link href="/dashboard/projects/new">
          <Button
            size="sm"
            className="w-full group transition-all"
          >
            <FolderPlus className="mr-2 h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            Create Your First Project
          </Button>
        </Link>
        <p className="text-[10px] text-muted-foreground">
          You&apos;ll be able to add team members and create tasks once you have a project.
        </p>
      </div>
    </div>
  );
}
