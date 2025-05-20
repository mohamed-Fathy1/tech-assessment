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
  employeeId: z.string().optional().nullable(),
});

export async function updateTask(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the employee ID from form data and handle "unassigned" value
  let employeeId = formData.get("employeeId") as string | null;
  if (employeeId === "unassigned") {
    employeeId = null;
  }

  const validatedFields = taskSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || "",
    priority: formData.get("priority") || "MEDIUM",
    status: formData.get("status") || "BACKLOG",
    employeeId: employeeId,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, ...data } = validatedFields.data;

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
      data,
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${task.project.id}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update task:", error);
    return { error: { _form: ["Failed to update task"] } };
  }
}
