"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DragStart,
} from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  createdAt: Date;
  employee: {
    name: string;
  } | null;
}

interface KanbanBoardProps {
  tasks: Task[];
}

const statusColumns = [
  { id: "BACKLOG", title: "Backlog", color: "bg-slate-100", borderColor: "border-slate-300", icon: "📋" },
  { id: "TODO", title: "To Do", color: "bg-blue-50", borderColor: "border-blue-200", icon: "📝" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-yellow-50", borderColor: "border-yellow-200", icon: "⚙️" },
  { id: "REVIEW", title: "Review", color: "bg-purple-50", borderColor: "border-purple-200", icon: "🔍" },
  { id: "DONE", title: "Done", color: "bg-green-50", borderColor: "border-green-200", icon: "✅" },
];

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);

  const tasksByStatus = statusColumns.reduce<Record<string, Task[]>>((acc, column) => {
    acc[column.id] = localTasks.filter((task) => task.status === column.id);
    return acc;
  }, {});

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    // Reset active task and dragging state
    setActiveTask(null);
    setDraggingOver(null);

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Find the task that was dragged
    const task = localTasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Update local state for immediate UI feedback
    const updatedTasks = localTasks.map((t) => (t.id === draggableId ? { ...t, status: destination.droppableId } : t));
    setLocalTasks(updatedTasks);

    // Update task status in the database
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("id", task.id);
      formData.append("status", destination.droppableId);

      const result = await updateTaskStatus(formData);
      if (result.error) {
        toast.error("Failed to update task status");
        // Revert local state on error
        setLocalTasks(tasks);
      } else {
        toast.success("Task status updated");
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
      // Revert local state on error
      setLocalTasks(tasks);
    } finally {
      setIsUpdating(false);
    }
  }

  function handleDragStart(start: DragStart) {
    setActiveTask(start.draggableId);
  }

  return (
    <DragDropContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col"
          >
            <h3 className="mb-2 flex items-center font-medium">
              <span className="mr-2">{column.icon}</span>
              <span className="text-sm font-semibold">{column.title}</span>
              <Badge
                variant="outline"
                className="ml-2 bg-background"
              >
                {tasksByStatus[column.id]?.length || 0}
              </Badge>
            </h3>
            <Droppable droppableId={column.id}>
              {(provided: DroppableProvided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  onMouseEnter={() => setDraggingOver(activeTask ? column.id : null)}
                  onMouseLeave={() => setDraggingOver(null)}
                  className={`flex flex-col space-y-2 min-h-[200px] p-2 rounded-lg border transition-all duration-200 ${
                    column.color
                  } ${column.borderColor} ${
                    draggingOver === column.id
                      ? "ring-2 ring-primary ring-opacity-50 shadow-lg"
                      : snapshot.isDraggingOver
                      ? "shadow-md"
                      : ""
                  }`}
                >
                  {tasksByStatus[column.id]?.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                      isDragDisabled={isUpdating}
                    >
                      {(provided: DraggableProvided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`shadow-sm transition-all duration-200 ${
                            snapshot.isDragging
                              ? "shadow-lg scale-[1.03] rotate-1 z-50 opacity-90"
                              : "hover:ring-2 hover:translate-y-[-2px]"
                          } ${
                            task.id === activeTask ? "ring-2 ring-primary shadow-md" : ""
                          } group relative bg-card border-card py-3 pl-1`}
                        >
                          <div
                            className={`absolute top-0 left-0 w-1 h-full rounded-l-md ${getPriorityColor(
                              task.priority,
                            )}`}
                          />
                          <CardHeader className="p-2 pb-0.5">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                              <span className="truncate mr-2">{task.title}</span>
                              <PriorityBadge priority={task.priority} />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2 pt-0 text-xs">
                            {task.description && (
                              <p className="mb-2 text-muted-foreground line-clamp-1 group-hover:line-clamp-2 transition-all duration-200">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-muted/30">
                              {task.employee ? (
                                <div className="flex items-center">
                                  <Avatar className="h-5 w-5 mr-1 border border-muted/30">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                      {getInitials(task.employee.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {task.employee.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1 text-muted-foreground/70" />
                                  Unassigned
                                </span>
                              )}
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="text-xs">
                                  {formatDistanceToNow(new Date(task.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {tasksByStatus[column.id]?.length === 0 && (
                    <div className="border border-dashed rounded-lg p-3 flex flex-col items-center justify-center text-center text-xs text-muted-foreground italic h-[80px]">
                      <div className="text-xl mb-1 opacity-30">{column.icon}</div>
                      <p>No tasks</p>
                      <p className="text-xs mt-0.5">Drag tasks here or create new ones</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs px-1.5 py-0.5 ${variants[priority]}`}
    >
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-slate-400",
    MEDIUM: "bg-blue-400",
    HIGH: "bg-orange-400",
    URGENT: "bg-red-400",
  };
  return colors[priority] || "bg-gray-400";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
