# Project and Task Management Implementation

## Overview

This document outlines the implementation plan for the project and task management feature of the Blurr HR Portal, which includes:

1. CRUD operations for projects
2. CRUD operations for tasks
3. Kanban board view for tasks by status
4. Backlog view for all tasks
5. Task assignment to employees

## Technical Implementation

### 1. Update Prisma Schema

First, we need to update the Prisma schema to include Project and Task models as described in the database schema design document.

### 2. Server Actions Implementation

We will create the following server actions for project and task management:

#### `createProject.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export async function createProject(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  try {
    await prisma.project.create({
      data: {
        ...validatedFields.data,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    return { error: { _form: ["Failed to create project"] } };
  }
}
```

#### `updateProject.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export async function updateProject(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = projectSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || "",
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, ...data } = validatedFields.data;

  try {
    // Verify that the project belongs to the current user
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project || project.userId !== session.user.id) {
      return { error: { _form: ["Unauthorized"] } };
    }

    await prisma.project.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${id}`);
    return { success: true };
  } catch (error) {
    return { error: { _form: ["Failed to update project"] } };
  }
}
```

#### `deleteProject.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteProject(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify that the project belongs to the current user
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project || project.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await prisma.project.delete({
      where: { id },
    });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete project" };
  }
}
```

#### `getProjects.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProjects() {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  return prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });
}
```

#### `getProject.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProject(id: string) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      tasks: true,
    },
  });

  return project;
}
```

#### `createTask.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  projectId: z.string(),
  employeeId: z.string().optional().nullable(),
});

export async function createTask(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    priority: formData.get("priority"),
    status: formData.get("status"),
    projectId: formData.get("projectId"),
    employeeId: formData.get("employeeId") || null,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  try {
    // Verify that the project belongs to the current user
    const project = await prisma.project.findUnique({
      where: {
        id: validatedFields.data.projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return { error: { _form: ["Unauthorized"] } };
    }

    // If employeeId is provided, verify that the employee belongs to the current user
    if (validatedFields.data.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: {
          id: validatedFields.data.employeeId,
          userId: session.user.id,
        },
      });

      if (!employee) {
        return { error: { employeeId: ["Invalid employee"] } };
      }
    }

    await prisma.task.create({
      data: validatedFields.data,
    });

    revalidatePath(`/dashboard/projects/${validatedFields.data.projectId}`);
    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    return { error: { _form: ["Failed to create task"] } };
  }
}
```

#### `updateTask.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  projectId: z.string(),
  employeeId: z.string().optional().nullable(),
});

export async function updateTask(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = taskSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || "",
    priority: formData.get("priority"),
    status: formData.get("status"),
    projectId: formData.get("projectId"),
    employeeId: formData.get("employeeId") || null,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, projectId, ...data } = validatedFields.data;

  try {
    // Verify that the task belongs to a project owned by the current user
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task || task.project.userId !== session.user.id) {
      return { error: { _form: ["Unauthorized"] } };
    }

    // If employeeId is provided, verify that the employee belongs to the current user
    if (data.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: {
          id: data.employeeId,
          userId: session.user.id,
        },
      });

      if (!employee) {
        return { error: { employeeId: ["Invalid employee"] } };
      }
    }

    await prisma.task.update({
      where: { id },
      data,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectId}/tasks/kanban`);
    revalidatePath(`/dashboard/projects/${projectId}/tasks/backlog`);
    return { success: true };
  } catch (error) {
    return { error: { _form: ["Failed to update task"] } };
  }
}
```

#### `deleteTask.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteTask(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify that the task belongs to a project owned by the current user
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task || task.project.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const projectId = task.projectId;

    await prisma.task.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectId}/tasks/kanban`);
    revalidatePath(`/dashboard/projects/${projectId}/tasks/backlog`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete task" };
  }
}
```

#### `updateTaskStatus.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const taskStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export async function updateTaskStatus(data: { id: string; status: string }) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = taskStatusSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, status } = validatedFields.data;

  try {
    // Verify that the task belongs to a project owned by the current user
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task || task.project.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const projectId = task.projectId;

    await prisma.task.update({
      where: { id },
      data: { status },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/dashboard/projects/${projectId}/tasks/kanban`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to update task status" };
  }
}
```

#### `getProjectTasks.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProjectTasks(projectId: string) {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  // Verify that the project belongs to the current user
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    return [];
  }

  return prisma.task.findMany({
    where: {
      projectId,
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
```

#### `getEmployeesForSelect.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getEmployeesForSelect() {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  const employees = await prisma.employee.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return employees;
}
```

### 3. UI Components

#### `ProjectForm.tsx`

A form component for creating and updating projects.

#### `ProjectTable.tsx`

A component for displaying a table of projects with edit and delete options.

#### `TaskForm.tsx`

A form component for creating and updating tasks.

#### `TaskTable.tsx`

A component for displaying a table of tasks.

#### `KanbanBoard.tsx`

A component for displaying tasks in a Kanban board format organized by status.

#### `TaskCard.tsx`

A component for displaying a task in the Kanban board.

### 4. Pages

#### `app/dashboard/projects/page.tsx`

The main projects page displaying the list of projects.

#### `app/dashboard/projects/new/page.tsx`

Page for adding a new project.

#### `app/dashboard/projects/[id]/page.tsx`

Page for viewing a project's details.

#### `app/dashboard/projects/[id]/edit/page.tsx`

Page for editing an existing project.

#### `app/dashboard/projects/[id]/tasks/new/page.tsx`

Page for adding a new task to a project.

#### `app/dashboard/projects/[id]/tasks/[taskId]/edit/page.tsx`

Page for editing an existing task.

#### `app/dashboard/projects/[id]/tasks/kanban/page.tsx`

Page for displaying tasks in a Kanban board view.

#### `app/dashboard/projects/[id]/tasks/backlog/page.tsx`

Page for displaying all tasks in a backlog view.

### 5. Integration Tests

- Test CRUD operations for project management
- Test CRUD operations for task management
- Test task assignment to employees
- Test Kanban board functionality
- Test authorization (users should only access their own projects and tasks)

## Implementation Steps

1. Update the Prisma schema
2. Generate Prisma client
3. Implement server actions
4. Create UI components
5. Create pages
6. Implement drag-and-drop functionality for the Kanban board
7. Test functionality
8. Add error handling and validation
9. Optimize performance
