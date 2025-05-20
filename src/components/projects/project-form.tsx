"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ProjectFormProps {
  project?: {
    id: string;
    name: string;
    description: string | null;
  };
}

// Define a more specific type for the error object
interface FormFieldErrors {
  name?: string[];
  description?: string[];
}

interface FormGlobalError {
  _form: string[];
}

type FormErrors = FormFieldErrors | FormGlobalError;

// Type guard to check if the error is a form-wide error
function isGlobalError(error: FormErrors): error is FormGlobalError {
  return "_form" in error;
}

export function ProjectForm({ project }: ProjectFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);

    try {
      console.log("Submitting form data...");
      const result = project ? await updateProject(formData) : await createProject(formData);
      console.log("Form submission result:", result);

      if (result.error) {
        if (isGlobalError(result.error)) {
          setFormError(result.error._form[0]);
          toast.error(result.error._form[0]);
        } else {
          setErrors(result.error);
          toast.error("Failed to save project");
        }
      } else {
        toast.success(project ? "Project updated" : "Project created");
        router.push("/dashboard/projects");
        router.refresh();
      }
    } catch (error) {
      console.error("Project form error:", error);
      setFormError(error instanceof Error ? error.message : "An unexpected error occurred");
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 max-w-xl"
    >
      {formError && (
        <Alert
          variant="destructive"
          className="mb-4 py-2"
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-2" />
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      {project?.id && (
        <input
          type="hidden"
          name="id"
          value={project.id}
        />
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="text-sm"
        >
          Project Name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={project?.name || ""}
          placeholder="Enter project name"
          required
          disabled={isSubmitting}
          className="h-8 text-sm"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="description"
          className="text-sm"
        >
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={project?.description || ""}
          placeholder="Enter project description"
          rows={3}
          disabled={isSubmitting}
          className="text-sm min-h-[80px]"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description[0]}</p>}
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-8 text-sm"
        >
          {isSubmitting ? "Saving..." : project ? "Update Project" : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="h-8 text-sm"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
