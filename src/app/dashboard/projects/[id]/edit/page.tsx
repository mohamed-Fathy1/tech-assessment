import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { getProject } from "@/lib/actions/projects";
import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/page-header";

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "Edit Project | Blurr HR Portal",
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="container py-6">
      <PageHeader
        heading="Edit Project"
        description="Update your project details."
        action={
          <Link href={`/dashboard/projects/${params.id}`}>
            <Button variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
        }
      />

      <div className="mt-6">
        <ProjectForm project={project} />
      </div>
    </div>
  );
}
