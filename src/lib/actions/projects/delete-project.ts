"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteProject(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
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
  } catch (error: unknown) {
    console.error("Failed to delete project:", error);
    return { error: "Failed to delete project" };
  }
}
