import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, PlusIcon, PencilIcon, CalendarClock, Layers, Clock } from "lucide-react";
import { getProject } from "@/lib/actions/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTasks } from "@/components/projects/project-tasks";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  // Count tasks by status
  const taskStatusCounts = {
    total: project.tasks.length,
    backlog: project.tasks.filter((t) => t.status === "BACKLOG").length,
    todo: project.tasks.filter((t) => t.status === "TODO").length,
    inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    review: project.tasks.filter((t) => t.status === "REVIEW").length,
    done: project.tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <div className="space-y-3">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeftIcon className="h-3 w-3 mr-1" />
          Back to projects
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.description && <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center">
                <CalendarClock className="h-3.5 w-3.5 mr-1" />
                <span>{format(new Date(project.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <Link href={`/dashboard/projects/${project.id}/tasks/new`}>
              <Button
                size="sm"
                className="h-7"
              >
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                New Task
              </Button>
            </Link>
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
              >
                <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
            <ProjectDeleteButton id={project.id} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-1 mb-2">
        {[
          {
            label: "Total",
            count: taskStatusCounts.total,
            icon: <Layers className="h-4 w-4 text-slate-500" />,
            color: "bg-slate-50 border-slate-200",
          },
          {
            label: "Backlog",
            count: taskStatusCounts.backlog,
            icon: <span className="text-sm">📋</span>,
            color: "bg-amber-50 border-amber-200",
          },
          {
            label: "In Progress",
            count: taskStatusCounts.inProgress,
            icon: <span className="text-sm">⚙️</span>,
            color: "bg-blue-50 border-blue-200",
          },
          {
            label: "Review",
            count: taskStatusCounts.review,
            icon: <span className="text-sm">🔍</span>,
            color: "bg-purple-50 border-purple-200",
          },
          {
            label: "Done",
            count: taskStatusCounts.done,
            icon: <span className="text-sm">✅</span>,
            color: "bg-green-50 border-green-200",
          },
        ].map((status, index) => (
          <div
            key={index}
            className="w-1/5 px-1 mb-2"
          >
            <Card className={`${status.color} h-[60px]`}>
              <CardContent className="p-2 flex items-center justify-between">
                <div className="flex items-center">
                  {status.icon}
                  <div className="ml-1.5 text-xs text-muted-foreground">{status.label}</div>
                </div>
                <div className="text-lg font-bold">{status.count}</div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
            defaultValue="all"
            className="w-full"
          >
            <div className="border-b px-3">
              <TabsList className="bg-transparent my-1 h-9">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-8"
                >
                  All Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="kanban"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-8"
                >
                  Kanban Board
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="all"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ProjectTasks tasks={project.tasks} />
            </TabsContent>
            <TabsContent
              value="kanban"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="flex justify-center p-4">
                <Link href="/dashboard/projects/tasks/kanban">
                  <Button
                    size="sm"
                    className="h-8"
                  >
                    View Kanban Board
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
