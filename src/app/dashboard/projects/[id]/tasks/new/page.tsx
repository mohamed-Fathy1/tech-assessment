import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { getProject } from "@/lib/actions/projects";
import { TaskForm } from "@/components/projects/task-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface NewTaskPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "New Task | Blurr HR Portal",
};

export default async function NewTaskPage({ params }: NewTaskPageProps) {
  // Ensure params is available
  const projectId = params.id;

  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  const employees = await prisma.employee.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container py-6">
      <PageHeader
        heading="New Task"
        description={`Create a new task for ${project.name}`}
        action={
          <Link href={`/dashboard/projects/${projectId}`}>
            <Button variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
        }
      />

      <div className="mt-6">
        <TaskForm
          projectId={projectId}
          employees={employees}
        />
      </div>
    </div>
  );
}
