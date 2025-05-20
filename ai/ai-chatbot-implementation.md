# AI Chatbot Implementation

## Overview

This document outlines the implementation plan for the AI chatbot feature of the Blurr HR Portal. The chatbot will enable users to ask questions about their projects and tasks using natural language.

## Features

1. Chat interface for user interactions
2. Natural language understanding for query interpretation
3. Query handlers for specific question types:
   - Task queries (e.g., "What are my tasks today?")
   - Project status queries (e.g., "What's the status of Project Apollo?")
   - Employee-related queries (e.g., "Show me tasks assigned to John")
   - General statistics (e.g., "How many tasks are in progress?")

## Technical Implementation

### 1. Server-Side Implementation

#### API Route for Chatbot

Create an API route to handle chatbot interactions and process user queries.

```typescript
// app/api/chatbot/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeQuery, QueryType } from "@/lib/chatbot/query-analyzer";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Analyze the user's query to determine intent
    const queryAnalysis = analyzeQuery(message.toLowerCase());

    // Handle the query based on its type
    let response;

    switch (queryAnalysis.type) {
      case QueryType.TASKS:
        response = await handleTasksQuery(queryAnalysis, session.user.id);
        break;
      case QueryType.PROJECT_STATUS:
        response = await handleProjectStatusQuery(queryAnalysis, session.user.id);
        break;
      case QueryType.EMPLOYEE_TASKS:
        response = await handleEmployeeTasksQuery(queryAnalysis, session.user.id);
        break;
      case QueryType.STATISTICS:
        response = await handleStatisticsQuery(queryAnalysis, session.user.id);
        break;
      default:
        response = {
          answer: "I'm not sure how to help with that. Try asking about your tasks, projects, or employees.",
        };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}

async function handleTasksQuery(analysis: QueryAnalysis, userId: string) {
  // Get today's tasks or tasks matching the query
  let tasks;

  if (analysis.timeframe === "today") {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    tasks = await prisma.task.findMany({
      where: {
        project: {
          userId,
        },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            name: true,
          },
        },
      },
    });
  } else if (analysis.status) {
    tasks = await prisma.task.findMany({
      where: {
        project: {
          userId,
        },
        status: analysis.status,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            name: true,
          },
        },
      },
    });
  } else {
    tasks = await prisma.task.findMany({
      where: {
        project: {
          userId,
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  if (tasks.length === 0) {
    return {
      answer: `You don't have any ${
        analysis.timeframe === "today"
          ? "tasks today"
          : analysis.status
          ? `${analysis.status.toLowerCase()} tasks`
          : "recent tasks"
      }.`,
    };
  }

  const taskList = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    project: task.project.name,
    assignedTo: task.employee?.name || "Unassigned",
  }));

  return {
    answer: `Here are your ${
      analysis.timeframe === "today"
        ? "tasks for today"
        : analysis.status
        ? `${analysis.status.toLowerCase()} tasks`
        : "recent tasks"
    }:`,
    data: {
      type: "tasks",
      tasks: taskList,
    },
  };
}

async function handleProjectStatusQuery(analysis: QueryAnalysis, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      userId,
      name: {
        contains: analysis.projectName,
        mode: "insensitive",
      },
    },
    include: {
      tasks: true,
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  if (!project) {
    return {
      answer: `I couldn't find a project named "${analysis.projectName}".`,
    };
  }

  // Calculate task statistics
  const totalTasks = project._count.tasks;
  const completedTasks = project.tasks.filter((task) => task.status === "DONE").length;
  const inProgressTasks = project.tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    answer: `Project "${project.name}" status:`,
    data: {
      type: "project",
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        totalTasks,
        completedTasks,
        inProgressTasks,
        percentComplete,
      },
    },
  };
}

async function handleEmployeeTasksQuery(analysis: QueryAnalysis, userId: string) {
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      name: {
        contains: analysis.employeeName,
        mode: "insensitive",
      },
    },
  });

  if (!employee) {
    return {
      answer: `I couldn't find an employee named "${analysis.employeeName}".`,
    };
  }

  const tasks = await prisma.task.findMany({
    where: {
      employeeId: employee.id,
    },
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  if (tasks.length === 0) {
    return {
      answer: `${employee.name} has no tasks assigned.`,
    };
  }

  const taskList = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    project: task.project.name,
  }));

  return {
    answer: `Tasks assigned to ${employee.name}:`,
    data: {
      type: "employee-tasks",
      employee: {
        id: employee.id,
        name: employee.name,
      },
      tasks: taskList,
    },
  };
}

async function handleStatisticsQuery(analysis: QueryAnalysis, userId: string) {
  // Get overall statistics
  const projects = await prisma.project.count({
    where: { userId },
  });

  const employees = await prisma.employee.count({
    where: { userId },
  });

  const taskStats = await prisma.task.groupBy({
    by: ["status"],
    where: {
      project: {
        userId,
      },
    },
    _count: {
      id: true,
    },
  });

  const taskStatusMap = Object.fromEntries(taskStats.map((stat) => [stat.status, stat._count.id]));

  return {
    answer: "Here are your current statistics:",
    data: {
      type: "statistics",
      statistics: {
        projects,
        employees,
        tasks: {
          backlog: taskStatusMap.BACKLOG || 0,
          todo: taskStatusMap.TODO || 0,
          inProgress: taskStatusMap.IN_PROGRESS || 0,
          review: taskStatusMap.REVIEW || 0,
          done: taskStatusMap.DONE || 0,
          total: Object.values(taskStatusMap).reduce((sum, count) => sum + count, 0),
        },
      },
    },
  };
}
```

#### Query Analyzer

Create a utility to analyze user queries and determine the intent.

```typescript
// lib/chatbot/query-analyzer.ts
export enum QueryType {
  TASKS, // e.g., "What are my tasks today?"
  PROJECT_STATUS, // e.g., "What's the status of Project Apollo?"
  EMPLOYEE_TASKS, // e.g., "Show me tasks assigned to John"
  STATISTICS, // e.g., "How many tasks are in progress?"
  UNKNOWN,
}

export interface QueryAnalysis {
  type: QueryType;
  timeframe?: string;
  status?: string;
  projectName?: string;
  employeeName?: string;
}

export function analyzeQuery(query: string): QueryAnalysis {
  // Task-related queries
  if (query.includes("task") || query.includes("todo") || query.includes("to do")) {
    const analysis: QueryAnalysis = { type: QueryType.TASKS };

    // Check for timeframe
    if (query.includes("today")) {
      analysis.timeframe = "today";
    } else if (query.includes("this week")) {
      analysis.timeframe = "this week";
    } else if (query.includes("this month")) {
      analysis.timeframe = "this month";
    }

    // Check for status
    if (query.includes("in progress")) {
      analysis.status = "IN_PROGRESS";
    } else if (query.includes("done") || query.includes("completed")) {
      analysis.status = "DONE";
    } else if (query.includes("backlog")) {
      analysis.status = "BACKLOG";
    } else if (query.includes("review")) {
      analysis.status = "REVIEW";
    } else if (query.includes("todo") || query.includes("to do")) {
      analysis.status = "TODO";
    }

    return analysis;
  }

  // Project status queries
  const projectMatch =
    query.match(/project\s+(\w+)/i) || query.match(/status of\s+(\w+)/i) || query.match(/how is\s+(\w+)/i);
  if (projectMatch || query.includes("project status")) {
    return {
      type: QueryType.PROJECT_STATUS,
      projectName: projectMatch ? projectMatch[1] : "",
    };
  }

  // Employee task queries
  const employeeMatch =
    query.match(/tasks? (assigned to|for)\s+(\w+)/i) ||
    query.match(/what is\s+(\w+)\s+working on/i) ||
    query.match(/what('s| is)\s+(\w+)\s+doing/i);
  if (employeeMatch) {
    return {
      type: QueryType.EMPLOYEE_TASKS,
      employeeName: employeeMatch[employeeMatch.length - 1],
    };
  }

  // Statistics queries
  if (
    query.includes("statistics") ||
    query.includes("stats") ||
    query.includes("how many") ||
    query.includes("count")
  ) {
    return { type: QueryType.STATISTICS };
  }

  // Unknown query type
  return { type: QueryType.UNKNOWN };
}
```

### 2. UI Components

#### `ChatInterface.tsx`

A component for the chat interface where users can send messages and view responses.

```tsx
// components/chatbot/ChatInterface.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  data?: any;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi there! How can I help you with your projects and tasks today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send to API
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add bot response to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.answer,
          data: data.data,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Blurr Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.data && <ChatbotDataDisplay data={message.data} />}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Ask about your tasks or projects..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `ChatbotDataDisplay.tsx`

A component to display structured data from the chatbot.

```tsx
// components/chatbot/ChatbotDataDisplay.tsx
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

interface EmployeeTasksData {
  employee: {
    id: string;
    name: string;
  };
  tasks: TaskData[];
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
    employee?: { id: string; name: string };
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

function EmployeeTasksDisplay({ employee, tasks }: EmployeeTasksData) {
  return (
    <div className="mt-2 space-y-2">
      <h4 className="font-medium">{employee.name}'s Tasks</h4>
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

function getStatusVariant(status: string) {
  switch (status) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "warning";
    case "REVIEW":
      return "info";
    case "BACKLOG":
      return "secondary";
    case "TODO":
      return "outline";
    default:
      return "default";
  }
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
}
```

### 3. Page Implementation

#### `app/dashboard/chatbot/page.tsx`

The page for the chatbot interface.

```tsx
// app/dashboard/chatbot/page.tsx
import { Metadata } from "next";
import { ChatInterface } from "@/components/chatbot/ChatInterface";

export const metadata: Metadata = {
  title: "Chatbot | Blurr HR Portal",
  description: "Ask questions about your projects and tasks",
};

export default async function ChatbotPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blurr Assistant</h1>
        <p className="text-muted-foreground">Ask questions about your projects, tasks, and employees</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChatInterface />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Example Questions</h2>
            <ul className="space-y-3 text-sm">
              <li>• "What are my tasks today?"</li>
              <li>• "Show me tasks in progress"</li>
              <li>• "What's the status of Project Apollo?"</li>
              <li>• "Show me tasks assigned to [employee name]"</li>
              <li>• "How many tasks are in progress?"</li>
              <li>• "Show me my project statistics"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Natural Language Processing Strategy

Since we're not using a specialized AI service in this implementation, we're using a rule-based approach with pattern matching to analyze user queries. This approach provides a good balance between functionality and simplicity for the scope of this project.

The query analyzer:

1. Uses regular expressions and string matching to identify the type of query
2. Extracts relevant entities (e.g., project names, employee names)
3. Identifies timeframes and task statuses
4. Maps the query to one of the predefined query types

## Implementation Steps

1. Create the query analyzer utility
2. Implement the chatbot API endpoint
3. Create UI components for the chat interface
4. Add the chatbot page to the dashboard
5. Test with various query patterns
6. Refine the query analyzer based on testing results

## Enhancements for Future Versions

1. Integrate with an actual AI/NLP service (e.g., OpenAI API) for more sophisticated query understanding
2. Add support for more complex queries and combinations
3. Implement conversation history and context awareness
4. Add more interactive visualizations for data responses
5. Enable proactive notifications and suggestions
