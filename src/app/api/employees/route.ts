import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate input
    if (!data.name || !data.joiningDate || typeof data.basicSalary !== "number" || data.basicSalary <= 0) {
      return NextResponse.json(
        { error: "Invalid input. Required: name, joiningDate, and positive basicSalary" },
        { status: 400 },
      );
    }

    // Find a user account to attach the employee to
    let testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    // If no test user, try to find any user
    if (!testUser) {
      testUser = await prisma.user.findFirst();

      // If still no user, create a test user
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            name: "Test User",
            email: "test@example.com",
            emailVerified: new Date(),
          },
        });
      }
    }

    // Generate a unique employee ID by finding the highest existing ID number
    const highestEmployee = await prisma.employee.findFirst({
      orderBy: {
        employeeId: "desc",
      },
    });

    let nextNumber = 1;
    if (highestEmployee) {
      // Extract the number from the employeeId (e.g., "EMP005" -> 5)
      const match = highestEmployee.employeeId.match(/EMP(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const employeeId = `EMP${nextNumber.toString().padStart(3, "0")}`;
    console.log(`Generated new employee ID: ${employeeId}`);

    // Create the employee
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        joiningDate: new Date(data.joiningDate),
        basicSalary: data.basicSalary,
        employeeId,
        userId: testUser.id,
      },
    });

    revalidatePath("/dashboard/employees");

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
