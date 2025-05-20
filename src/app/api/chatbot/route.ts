import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeQuery, QueryType } from "@/lib/chatbot/query-analyzer";

interface QueryAnalysis {
  type: QueryType;
  timeframe?: string;
  status?: string;
  projectName?: string;
  employeeName?: string;
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || !session.user.id) {
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
  if (!analysis.projectName) {
    return {
      answer: "Please specify a project name to check its status.",
    };
  }

  const project = await prisma.project.findFirst({
    where: {
      userId,
      name: {
        contains: analysis.projectName,
      },
    },
    include: {
      tasks: true,
    },
  });

  if (!project) {
    return {
      answer: `I couldn't find a project named "${analysis.projectName}".`,
    };
  }

  // Calculate task statistics
  const totalTasks = project.tasks.length;
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
        description: project.description || "",
        totalTasks,
        completedTasks,
        inProgressTasks,
        percentComplete,
      },
    },
  };
}

async function handleEmployeeTasksQuery(analysis: QueryAnalysis, userId: string) {
  if (!analysis.employeeName) {
    return {
      answer: "Please specify an employee name to check their tasks.",
    };
  }

  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      name: {
        contains: analysis.employeeName,
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
