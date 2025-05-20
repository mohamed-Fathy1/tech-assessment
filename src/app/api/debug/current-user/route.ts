import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get current session
    const session = await auth();

    // Check for existing employees
    const employeeCount = await prisma.employee.count();

    // Get test user
    const testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    // Get the first employee if any
    const firstEmployee = await prisma.employee.findFirst({
      select: {
        id: true,
        employeeId: true,
        name: true,
        userId: true,
      },
    });

    // Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      authenticated: !!session?.user,
      user: session?.user,
      employeeCount,
      testUser: testUser
        ? {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
          }
        : null,
      firstEmployee,
      allUsers,
      systemTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch debug information",
      },
      { status: 500 },
    );
  }
}
