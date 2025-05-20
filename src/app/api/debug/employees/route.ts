import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        basicSalary: true,
        userId: true,
      },
    });

    // Get authentication
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get all salaries
    const salaries = await prisma.salary.findMany({
      take: 10, // Limit to 10 records
      select: {
        id: true,
        month: true,
        bonus: true,
        deduction: true,
        employeeId: true,
      },
    });

    return NextResponse.json({
      currentUserId,
      userCount: users.length,
      users: users.map((u) => ({ id: u.id, email: u.email, name: u.name })),
      employeeCount: employees.length,
      employees,
      salaryCount: salaries.length,
      salaries,
      systemDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ error: "Failed to fetch debug data" }, { status: 500 });
  }
}
