"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask, updateTask } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, User } from "lucide-react";

interface Employee {
  id: string;
  name: string;
}

interface TaskFormProps {
  projectId: string;
  employees: Employee[];
  task?: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    employeeId: string | null;
  };
}

export function TaskForm({ projectId, employees, task }: TaskFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    if (!task) {
      formData.append("projectId", projectId);
    }

    try {
      const result = task ? await updateTask(formData) : await createTask(formData);

      if (result.error) {
        setErrors(result.error);
        toast.error("Failed to save task");
      } else {
        toast.success(task ? "Task updated" : "Task created");
        router.push(`/dashboard/projects/${projectId}`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg">{task ? "Edit Task" : "Create New Task"}</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4 pt-0">
          {task?.id && (
            <input
              type="hidden"
              name="id"
              value={task.id}
            />
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="title"
              className="text-sm font-medium"
            >
              Task Title
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={task?.title || ""}
              placeholder="Enter a clear, specific task title"
              required
              disabled={isSubmitting}
              className="w-full h-8"
            />
            {errors.title && <p className="text-sm text-destructive mt-0.5">{errors.title[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-sm font-medium"
            >
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={task?.description || ""}
              placeholder="Provide details, requirements, or any additional context"
              rows={3}
              disabled={isSubmitting}
              className="w-full resize-none min-h-[70px]"
            />
            {errors.description && <p className="text-sm text-destructive mt-0.5">{errors.description[0]}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="priority"
                className="text-sm font-medium flex items-center"
              >
                <AlertTriangle className="h-4 w-4 mr-1 text-muted-foreground" />
                Priority Level
              </Label>
              <Select
                name="priority"
                defaultValue={task?.priority || "MEDIUM"}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="priority"
                  className="w-full h-8"
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-slate-400 mr-2"></span>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-orange-400 mr-2"></span>
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-red-400 mr-2"></span>
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-destructive mt-0.5">{errors.priority[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="status"
                className="text-sm font-medium flex items-center"
              >
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                Current Status
              </Label>
              <Select
                name="status"
                defaultValue={task?.status || "BACKLOG"}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="status"
                  className="w-full h-8"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">
                    <span className="flex items-center">
                      <span className="text-sm mr-2">📋</span>
                      Backlog
                    </span>
                  </SelectItem>
                  <SelectItem value="TODO">
                    <span className="flex items-center">
                      <span className="text-sm mr-2">📝</span>
                      To Do
                    </span>
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    <span className="flex items-center">
                      <span className="text-sm mr-2">⚙️</span>
                      In Progress
                    </span>
                  </SelectItem>
                  <SelectItem value="REVIEW">
                    <span className="flex items-center">
                      <span className="text-sm mr-2">🔍</span>
                      Review
                    </span>
                  </SelectItem>
                  <SelectItem value="DONE">
                    <span className="flex items-center">
                      <span className="text-sm mr-2">✅</span>
                      Done
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive mt-0.5">{errors.status[0]}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="employeeId"
              className="text-sm font-medium flex items-center"
            >
              <User className="h-4 w-4 mr-1 text-muted-foreground" />
              Assign To (Optional)
            </Label>
            <Select
              name="employeeId"
              defaultValue={task?.employeeId || ""}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="employeeId"
                className="w-full h-8"
              >
                <SelectValue placeholder="Assign to team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground">Unassigned</span>
                </SelectItem>
                {employees.map((employee) => (
                  <SelectItem
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <p className="text-sm text-destructive mt-0.5">{errors.employeeId[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-3 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-8"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>{task ? "Updating..." : "Creating..."}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>{task ? "Update Task" : "Create Task"}</span>
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
