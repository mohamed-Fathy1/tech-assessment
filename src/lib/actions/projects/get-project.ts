"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProject(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      tasks: {
        include: {
          employee: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (project) {
    // Add projectId to each task for convenience
    const tasksWithProjectId = project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
    }));

    return {
      ...project,
      tasks: tasksWithProjectId,
    };
  }

  return null;
}
