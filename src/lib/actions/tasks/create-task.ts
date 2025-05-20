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

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the employee ID from form data and handle "unassigned" value
  let employeeId = formData.get("employeeId") as string | null;
  if (employeeId === "unassigned") {
    employeeId = null;
  }

  const validatedFields = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    priority: formData.get("priority") || "MEDIUM",
    status: formData.get("status") || "BACKLOG",
    projectId: formData.get("projectId"),
    employeeId: employeeId,
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
      select: { id: true },
    });

    if (!project) {
      return { error: { _form: ["Unauthorized"] } };
    }

    await prisma.task.create({
      data: validatedFields.data,
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${validatedFields.data.projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create task:", error);
    return { error: { _form: ["Failed to create task"] } };
  }
}
