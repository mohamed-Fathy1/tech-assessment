"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const taskStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export async function updateTaskStatus(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedFields = taskStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, status } = validatedFields.data;

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
      return { error: { _form: ["Unauthorized"] } };
    }

    await prisma.task.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${task.project.id}`);
    revalidatePath("/dashboard/projects/tasks/kanban");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update task status:", error);
    return { error: { _form: ["Failed to update task status"] } };
  }
}
