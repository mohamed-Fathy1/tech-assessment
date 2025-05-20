import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const sampleEmployees = [
  {
    name: "John Doe",
    joiningDate: new Date("2025-01-15"),
    basicSalary: 5000,
  },
  {
    name: "Jane Smith",
    joiningDate: new Date("2025-02-10"),
    basicSalary: 6000,
  },
  {
    name: "Michael Johnson",
    joiningDate: new Date("2025-03-05"),
    basicSalary: 5500,
  },
  {
    name: "Emily Davis",
    joiningDate: new Date("2025-01-20"),
    basicSalary: 4800,
  },
];

export async function POST() {
  try {
    // Find or create a test user
    let testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
          emailVerified: new Date(),
        },
      });
    }

    // Check if we have employees
    const employeeCount = await prisma.employee.count();

    // Only create sample employees if none exist
    if (employeeCount === 0) {
      // Create sample employees
      const createdEmployees: Array<{ id: string; employeeId: string; name: string }> = [];

      for (const data of sampleEmployees) {
        // Generate employee ID
        const nextNumber: number = createdEmployees.length + 1;
        const employeeId: string = `EMP${nextNumber.toString().padStart(3, "0")}`;

        const employee = await prisma.employee.create({
          data: {
            ...data,
            employeeId,
            userId: testUser.id,
          },
        });

        createdEmployees.push(employee);
      }

      // Revalidate paths
      revalidatePath("/dashboard/employees");

      return NextResponse.json({
        success: true,
        message: `Created ${createdEmployees.length} sample employees`,
        employees: createdEmployees,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Employees already exist, no recovery needed",
        employeeCount,
      });
    }
  } catch (error) {
    console.error("Error recovering data:", error);
    return NextResponse.json(
      {
        error: "Failed to recover data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
