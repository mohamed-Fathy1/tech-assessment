"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Get a single task by ID
 */
export async function getTask(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return task;
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
}
