"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  assignedTo?: string;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  percentComplete: number;
}

interface EmployeeData {
  id: string;
  name: string;
}

interface StatisticsData {
  projects: number;
  employees: number;
  tasks: {
    backlog: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    total: number;
  };
}

interface ChatbotDataDisplayProps {
  data: {
    type: "tasks" | "project" | "employee-tasks" | "statistics";
    tasks?: TaskData[];
    project?: ProjectData;
    employee?: EmployeeData;
    statistics?: StatisticsData;
  };
}

export function ChatbotDataDisplay({ data }: ChatbotDataDisplayProps) {
  if (!data) return null;

  switch (data.type) {
    case "tasks":
      return <TasksDisplay tasks={data.tasks || []} />;
    case "project":
      return <ProjectDisplay project={data.project!} />;
    case "employee-tasks":
      return (
        <EmployeeTasksDisplay
          employee={data.employee!}
          tasks={data.tasks || []}
        />
      );
    case "statistics":
      return <StatisticsDisplay statistics={data.statistics!} />;
    default:
      return null;
  }
}

function TasksDisplay({ tasks }: { tasks: TaskData[] }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Assigned To</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.title}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(task.status)}>{formatStatus(task.status)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityVariant(task.priority)}>{formatPriority(task.priority)}</Badge>
              </TableCell>
              <TableCell>{task.project}</TableCell>
              <TableCell>{task.assignedTo || "Unassigned"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectDisplay({ project }: { project: ProjectData }) {
  return (
    <div className="mt-2 space-y-4">
      <div>
        <h4 className="font-medium">{project.name}</h4>
        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm">Progress: {project.percentComplete}%</span>
          <span className="text-sm">
            {project.completedTasks} of {project.totalTasks} tasks completed
          </span>
        </div>
        <Progress
          value={project.percentComplete}
          className="h-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Tasks in progress</p>
          <p className="text-2xl font-semibold">{project.inProgressTasks}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tasks completed</p>
          <p className="text-2xl font-semibold">{project.completedTasks}</p>
        </div>
      </div>
    </div>
  );
}

function EmployeeTasksDisplay({ employee, tasks }: { employee: EmployeeData; tasks: TaskData[] }) {
  return (
    <div className="mt-2 space-y-2">
      <h4 className="font-medium">{employee.name}&apos;s Tasks</h4>
      <TasksDisplay tasks={tasks} />
    </div>
  );
}

function StatisticsDisplay({ statistics }: { statistics: StatisticsData }) {
  return (
    <div className="mt-2 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Projects</p>
          <p className="text-2xl font-semibold">{statistics.projects}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Employees</p>
          <p className="text-2xl font-semibold">{statistics.employees}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Tasks</p>
          <p className="text-2xl font-semibold">{statistics.tasks.total}</p>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Task Status Breakdown</h4>
        <div className="grid grid-cols-5 gap-2">
          <div className="flex flex-col items-center">
            <Badge variant="outline">Backlog</Badge>
            <p className="mt-1 font-semibold">{statistics.tasks.backlog}</p>
          </div>
          <div className="flex flex-col items-center">
            <Badge variant="outline">To Do</Badge>
            <p className="mt-1 font-semibold">{statistics.tasks.todo}</p>
          </div>
          <div className="flex flex-col items-center">
            <Badge variant="outline">In Progress</Badge>
            <p className="mt-1 font-semibold">{statistics.tasks.inProgress}</p>
          </div>
          <div className="flex flex-col items-center">
            <Badge variant="outline">Review</Badge>
            <p className="mt-1 font-semibold">{statistics.tasks.review}</p>
          </div>
          <div className="flex flex-col items-center">
            <Badge variant="outline">Done</Badge>
            <p className="mt-1 font-semibold">{statistics.tasks.done}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPriority(priority: string) {
  return priority.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusVariant(status: string): "secondary" | "outline" | "default" | "destructive" {
  switch (status) {
    case "DONE":
      return "default";
    case "IN_PROGRESS":
      return "destructive";
    case "REVIEW":
      return "destructive";
    case "BACKLOG":
      return "secondary";
    case "TODO":
      return "outline";
    default:
      return "default";
  }
}

function getPriorityVariant(priority: string): "secondary" | "outline" | "default" | "destructive" {
  switch (priority) {
    case "URGENT":
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "destructive";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
}
