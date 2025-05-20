"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteTask(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify that the task belongs to a project owned by the current user
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
            id: true,
          },
        },
      },
    });

    if (!task || task.project.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const projectId = task.project.id;

    await prisma.task.delete({
      where: { id },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete task:", error);
    return { error: "Failed to delete task" };
  }
}
