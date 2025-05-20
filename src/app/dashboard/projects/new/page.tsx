import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "New Project | Blurr HR Portal",
};

export default function NewProjectPage() {
  return (
    <div className="container py-6">
      <PageHeader
        heading="New Project"
        description="Create a new project for your team."
        action={
          <Link href="/dashboard/projects">
            <Button variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        }
      />

      <div className="mt-6">
        <ProjectForm />
      </div>
    </div>
  );
}
