import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all employees without any auth checks
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        basicSalary: true,
        userId: true,
        joiningDate: true,
      },
    });

    return NextResponse.json({
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Error fetching all employees:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch employees",
      },
      { status: 500 },
    );
  }
}
