"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProjects() {
  const session = await auth();

  if (!session?.user?.id) {
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
