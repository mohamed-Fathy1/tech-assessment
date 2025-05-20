"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getTasks() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return prisma.task.findMany({
    where: {
      project: {
        userId: session.user.id,
      },
    },
    include: {
      project: {
        select: {
          name: true,
        },
      },
      employee: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
