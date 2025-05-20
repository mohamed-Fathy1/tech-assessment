"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrashIcon, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/lib/actions/projects";
import { toast } from "sonner";

interface ProjectDeleteButtonProps {
  id: string;
}

export function ProjectDeleteButton({ id }: ProjectDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteProject(id);
      if (result.success) {
        toast.success("Project deleted successfully");
        setOpen(false);
        router.push("/dashboard/projects");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete project");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive w-full md:w-auto"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center justify-center text-center mb-2">
            <div className="bg-destructive/10 p-3 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Delete Project?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center">
            This will permanently delete the project and all of its associated tasks.
            <span className="block font-medium text-destructive mt-2">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
          <AlertDialogCancel
            disabled={isDeleting}
            className="w-full sm:w-auto mt-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Yes, Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
