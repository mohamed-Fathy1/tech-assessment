"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDeleteDialog } from "@/components/projects/task-delete-dialog";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  projectId: string;
}

interface TaskActionsProps {
  task: Task;
}

export function TaskActions({ task }: TaskActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <MoreHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/projects/${task.projectId}/tasks/${task.id}/edit`}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        taskId={task.id}
        taskTitle={task.title}
      />
    </>
  );
}
