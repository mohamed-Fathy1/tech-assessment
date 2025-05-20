"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTask } from "@/lib/actions/tasks";
import { toast } from "sonner";

interface TaskDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function TaskDeleteDialog({ open, onOpenChange, taskId, taskTitle }: TaskDeleteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        toast.success("Task deleted successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete task");
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
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the task &quot;{taskTitle}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
