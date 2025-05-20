"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { startOfMonth } from "date-fns";

// Schema for updating salary
const salarySchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  month: z.string().min(1, "Month is required"),
  bonus: z.number().min(0, "Bonus cannot be negative"),
  deduction: z.number().min(0, "Deduction cannot be negative"),
});

interface SalaryTableEntry {
  id: string;
  employeeId: string;
  name: string;
  basicSalary: number;
  bonus: number;
  deduction: number;
  total: number;
  salaryId?: string;
}

// Define types for API responses
interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string; // ISO date string
  bonus: number;
  deduction: number;
}

interface EmployeeData {
  id: string;
  employeeId: string;
  name: string;
  basicSalary: number;
  userId: string;
  joiningDate: string;
}

// Get the test user for development
async function getTestUser() {
  try {
    // Try to find the test user
    let user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    // If no test user found, try to find any user
    if (!user) {
      console.log("Test user not found, trying to find any user");
      user = await prisma.user.findFirst();

      if (user) {
        console.log(`Found another user: ${user.email}`);
      }
    }

    if (!user) {
      console.log("No users found in the database");
    }

    return user;
  } catch (error) {
    console.error("Error fetching test user:", error);
    return null;
  }
}

/**
 * Get salary table for a specific month
 */
export async function getSalaryTable(monthDate: Date): Promise<SalaryTableEntry[]> {
  console.log("getSalaryTable called with date:", monthDate.toISOString());

  try {
    // Adjust date to ensure we're looking at the right month
    const adjustedMonth = new Date(monthDate);
    if (adjustedMonth.getFullYear() > 2024) {
      adjustedMonth.setFullYear(2024);
    }

    // Format the month for API call
    const monthString = adjustedMonth.toISOString().split("T")[0];

    // 1. First fetch all employees
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const employeesResponse = await fetch(`${apiUrl}/api/employees/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!employeesResponse.ok) {
      console.error("Failed to fetch employees:", employeesResponse.statusText);
      return [];
    }

    const employeesData = await employeesResponse.json();
    console.log(`API returned ${employeesData.count} employees`);

    if (employeesData.count === 0) {
      return [];
    }

    // 2. Fetch salary data for the specific month
    const salariesResponse = await fetch(`${apiUrl}/api/employees/salary?month=${monthString}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    let salaryRecords: SalaryRecord[] = [];
    if (salariesResponse.ok) {
      const salariesData = await salariesResponse.json();
      salaryRecords = salariesData.salaries || [];
      console.log(`Found ${salaryRecords.length} salary records for month ${monthString}`);
    } else {
      console.error("Failed to fetch salary data:", salariesResponse.statusText);
    }

    // Create a lookup map for salary records by employee ID
    const salaryMap: Record<string, SalaryRecord> = {};
    salaryRecords.forEach((salary) => {
      salaryMap[salary.employeeId] = salary;
    });

    // Format employees into the format expected by the UI
    return employeesData.employees.map((employee: EmployeeData) => {
      // Find salary record for this employee in the current month
      const salaryRecord = salaryMap[employee.id];

      return {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        basicSalary: employee.basicSalary,
        bonus: salaryRecord?.bonus || 0,
        deduction: salaryRecord?.deduction || 0,
        total: employee.basicSalary + (salaryRecord?.bonus || 0) - (salaryRecord?.deduction || 0),
        salaryId: salaryRecord?.id,
      };
    });
  } catch (error) {
    console.error("Error fetching salary table:", error);
    return [];
  }
}

/**
 * Update or create a salary entry for an employee and month
 */
export async function updateSalary(formData: FormData) {
  const session = await auth();

  // For development purposes, get the test user if auth is not available
  let userId = session?.user?.id;

  if (!userId) {
    // Fallback to test user for development
    const testUser = await getTestUser();
    if (!testUser) {
      throw new Error("No test user found. Please run 'npx prisma db seed' first.");
    }
    userId = testUser.id;
  }

  const validatedFields = salarySchema.safeParse({
    employeeId: formData.get("employeeId"),
    month: formData.get("month"),
    bonus: parseFloat((formData.get("bonus") as string) || "0"),
    deduction: parseFloat((formData.get("deduction") as string) || "0"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  try {
    // Get the employee first, regardless of user
    const employee = await prisma.employee.findUnique({
      where: { id: validatedFields.data.employeeId },
    });

    if (!employee) {
      return { error: { _form: ["Employee not found"] } };
    }

    const { employeeId, month, ...data } = validatedFields.data;
    const monthDate = new Date(month);

    // If the date is in the future, use the current year instead
    if (monthDate.getFullYear() > 2024) {
      monthDate.setFullYear(2024);
    }

    // Always use start of month for consistent comparison
    const startOfMonthDate = startOfMonth(monthDate);

    console.log(`Updating salary for employee ${employeeId} for month: ${startOfMonthDate.toISOString()}`);

    // Check if a salary record exists for this employee (regardless of month for now)
    const existingSalary = await prisma.salary.findFirst({
      where: {
        employeeId,
        // Temporarily skip date filtering due to system date issue
        // month: {
        //   gte: startOfMonthDate,
        //   lte: endOfMonthDate,
        // },
      },
    });

    if (existingSalary) {
      // Update existing record
      console.log(`Updating existing salary record: ${existingSalary.id}`);
      await prisma.salary.update({
        where: { id: existingSalary.id },
        data: {
          ...data,
          month: startOfMonthDate, // Update the month to match the current selection
        },
      });
    } else {
      // Create new record
      console.log(`Creating new salary record for ${employeeId}`);
      await prisma.salary.create({
        data: {
          ...data,
          employeeId,
          month: startOfMonthDate,
        },
      });
    }

    revalidatePath("/dashboard/employees/salary-table");
    return { success: true };
  } catch (error) {
    console.error("Error updating salary:", error);
    return { error: { _form: ["Failed to update salary"] } };
  }
}

/**
 * Delete a salary entry
 */
export async function deleteSalary(id: string) {
  const session = await auth();

  // For development purposes, get the test user if auth is not available
  let userId = session?.user?.id;

  if (!userId) {
    // Fallback to test user for development
    const testUser = await getTestUser();
    if (!testUser) {
      throw new Error("No test user found. Please run 'npx prisma db seed' first.");
    }
    userId = testUser.id;
  }

  try {
    // Verify that the salary belongs to an employee of the current user
    const salary = await prisma.salary.findUnique({
      where: { id },
      include: {
        employee: {
          select: { userId: true },
        },
      },
    });

    if (!salary || salary.employee.userId !== userId) {
      return { error: "Unauthorized" };
    }

    await prisma.salary.delete({
      where: { id },
    });

    revalidatePath("/dashboard/employees/salary-table");
    return { success: true };
  } catch (error) {
    console.error("Error deleting salary:", error);
    return { error: "Failed to delete salary" };
  }
}
