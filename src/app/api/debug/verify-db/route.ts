import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Check if we have users
    const usersCount = await prisma.user.count();

    if (usersCount === 0) {
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
          emailVerified: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Created test user",
        user: {
          id: testUser.id,
          email: testUser.email,
        },
      });
    }

    // Get the test user or any other user
    const testUser =
      (await prisma.user.findUnique({
        where: { email: "test@example.com" },
      })) || (await prisma.user.findFirst());

    if (!testUser) {
      return NextResponse.json(
        {
          error: "No users found and couldn't create test user",
        },
        { status: 500 },
      );
    }

    // Find employees with no valid userId
    const orphanedEmployees = await prisma.employee.findMany({
      where: {
        userId: {
          not: testUser.id,
        },
      },
    });

    let fixedCount = 0;

    if (orphanedEmployees.length > 0) {
      // Fix orphaned employees
      const result = await prisma.employee.updateMany({
        where: {
          userId: {
            not: testUser.id,
          },
        },
        data: {
          userId: testUser.id,
        },
      });

      fixedCount = result.count;
    }

    return NextResponse.json({
      success: true,
      message: `Database verified. Found ${usersCount} users, fixed ${fixedCount} employees.`,
      testUser: {
        id: testUser.id,
        email: testUser.email,
      },
    });
  } catch (error) {
    console.error("Error verifying database:", error);
    return NextResponse.json(
      {
        error: "Failed to verify database integrity",
      },
      { status: 500 },
    );
  }
}
