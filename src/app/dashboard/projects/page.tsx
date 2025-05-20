import { Suspense } from "react";
import { getProjects } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsEmptyState } from "@/components/projects/projects-empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Projects | Blurr HR Portal",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        heading="Projects"
        description="Manage your projects and tasks."
        action={
          <Link href="/dashboard/projects/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsList />
      </Suspense>
    </>
  );
}

async function ProjectsList() {
  const projects = await getProjects();

  if (projects.length === 0) {
    return <ProjectsEmptyState />;
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
        />
      ))}
    </div>
  );
}

function ProjectsLoading() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-3 shadow-sm animate-pulse h-[110px]"
        >
          <div className="h-3 w-2/3 rounded-md bg-muted mb-2" />
          <div className="h-2 w-full rounded-md bg-muted mb-1" />
          <div className="h-2 w-1/2 rounded-md bg-muted" />
          <div className="mt-3 pt-1.5 border-t flex items-center justify-between">
            <div className="h-2 w-1/4 rounded-md bg-muted" />
            <div className="h-3 w-6 rounded-sm bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
