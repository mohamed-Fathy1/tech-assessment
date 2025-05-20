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

  if (!session?.user?.id) {
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
  } catch (error: unknown) {
    console.error("Failed to update project:", error);
    return { error: { _form: ["Failed to update project"] } };
  }
}
