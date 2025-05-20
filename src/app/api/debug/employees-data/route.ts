import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get employees with user info
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Get total employees count
    const employeeCount = await prisma.employee.count();

    // Get users count
    const usersCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      employeeCount,
      usersCount,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch employees data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
