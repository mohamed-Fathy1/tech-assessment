import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Find the test user - this should exist if database is seeded
    const testUser = await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    });

    if (!testUser) {
      return NextResponse.json({ error: "Test user not found" }, { status: 404 });
    }

    // Fix any employees that might not be properly associated
    const updated = await prisma.employee.updateMany({
      where: {
        NOT: {
          userId: testUser.id,
        },
      },
      data: {
        userId: testUser.id,
      },
    });

    // Clear Next.js cache to ensure fresh data
    try {
      await fetch("/api/revalidate?path=/dashboard/employees", { method: "GET" });
    } catch (revalidateError) {
      console.error("Error revalidating cache:", revalidateError);
    }

    return NextResponse.json({
      success: true,
      fixed: updated.count,
      testUserId: testUser.id,
    });
  } catch (error) {
    console.error("Error fixing employee relations:", error);
    return NextResponse.json({ error: "Failed to fix employee relations" }, { status: 500 });
  }
}
