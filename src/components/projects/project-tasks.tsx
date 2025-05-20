import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TaskActions } from "@/components/projects/task-actions";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList, AlertCircle, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  createdAt: Date;
  projectId: string;
  employee: {
    name: string;
  } | null;
}

interface ProjectTasksProps {
  tasks: Task[];
}

export function ProjectTasks({ tasks }: ProjectTasksProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-primary/5 p-3 mb-3">
          <ClipboardList className="h-6 w-6 text-primary/70" />
        </div>
        <h3 className="text-base font-medium mb-1">No tasks found</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          This project doesn&apos;t have any tasks yet. Create your first task to start tracking work.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40%] h-8 text-xs">Title</TableHead>
            <TableHead className="w-[15%] h-8 text-xs">Status</TableHead>
            <TableHead className="w-[15%] h-8 text-xs">Priority</TableHead>
            <TableHead className="w-[15%] h-8 text-xs">Assigned To</TableHead>
            <TableHead className="w-[15%] h-8 text-xs">Created</TableHead>
            <TableHead className="w-[80px] h-8 text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="group h-12"
            >
              <TableCell className="py-2">
                <div className="flex items-start">
                  <div
                    className={`w-1 h-6 rounded-full mr-2 mt-0.5 flex-shrink-0 ${getPriorityColor(task.priority)}`}
                  />
                  <div>
                    <div className="text-xs font-medium group-hover:text-primary transition-colors">{task.title}</div>
                    {task.description && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all duration-200">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <StatusBadge status={task.status} />
              </TableCell>
              <TableCell className="py-2">
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell className="py-2">
                {task.employee ? (
                  <div className="flex items-center">
                    <Avatar className="h-4 w-4 mr-1.5">
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                        {getInitials(task.employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{task.employee.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 text-muted-foreground/70" />
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-[10px] py-2">
                {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="py-2">
                <TaskActions task={task} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    BACKLOG: "bg-slate-100 text-slate-800 border-slate-200",
    TODO: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
    REVIEW: "bg-purple-100 text-purple-800 border-purple-200",
    DONE: "bg-green-100 text-green-800 border-green-200",
  };

  const labels: Record<string, string> = {
    BACKLOG: "Backlog",
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    DONE: "Done",
  };

  const icons: Record<string, string> = {
    BACKLOG: "📋",
    TODO: "📝",
    IN_PROGRESS: "⚙️",
    REVIEW: "🔍",
    DONE: "✅",
  };

  return (
    <Badge
      variant="outline"
      className={`px-1.5 py-0.5 text-[10px] ${variants[status]}`}
    >
      <span className="mr-1 text-[10px]">{icons[status]}</span>
      <span>{labels[status] || status}</span>
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-800 border-slate-200",
    MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    URGENT: "bg-red-100 text-red-800 border-red-200",
  };

  const icons: Record<string, React.ReactNode> = {
    LOW: null,
    MEDIUM: null,
    HIGH: <AlertTriangle className="h-2.5 w-2.5 mr-1" />,
    URGENT: <AlertCircle className="h-2.5 w-2.5 mr-1" />,
  };

  return (
    <Badge
      variant="outline"
      className={`px-1.5 py-0.5 text-[10px] ${variants[priority]}`}
    >
      {icons[priority]}
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
