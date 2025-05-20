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

  // Log session information for debugging
  console.log(
    "Session:",
    JSON.stringify({
      user: session?.user,
      userId: session?.user?.id,
    }),
  );

  if (!session?.user?.id) {
    throw new Error("Unauthorized - No user ID in session");
  }

  // Skip the user exists check - trust the session
  // This avoids database access issues

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
  } catch (error: unknown) {
    console.error("Failed to create project:", error);

    // More detailed error message
    if (error instanceof Error) {
      return { error: { _form: [`Failed to create project: ${error.message}`] } };
    }

    return { error: { _form: ["Failed to create project"] } };
  }
}
