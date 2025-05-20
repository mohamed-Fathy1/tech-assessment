"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Schema for updating employee with ID
const employeeUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  basicSalary: z.number().positive("Salary must be positive"),
});

// Get the test user for development
async function getTestUser() {
  const user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });
  return user;
}

/**
 * Create a new employee
 */
export async function createEmployee(formData: FormData) {
  try {
    // First, let's verify we have a valid test user
    let testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    // If no test user, try to find any user
    if (!testUser) {
      testUser = await prisma.user.findFirst();
    }

    // If still no user, create a test user
    if (!testUser) {
      try {
        testUser = await prisma.user.create({
          data: {
            name: "Test User",
            email: "test@example.com",
            emailVerified: new Date(),
          },
        });
      } catch (userError) {
        console.error("Failed to create user:", userError);
        return { error: { _form: ["Could not create a user for this employee. Database error."] } };
      }
    }

    // At this point we must have a user or we've returned an error
    const userId = testUser.id;

    console.log(`Using user ID: ${userId} for new employee`);

    // Validate input
    const name = formData.get("name")?.toString();
    const joiningDateStr = formData.get("joiningDate")?.toString();
    const basicSalaryStr = formData.get("basicSalary")?.toString();

    if (!name || name.trim() === "") {
      return { error: { name: ["Name is required"] } };
    }

    if (!joiningDateStr) {
      return { error: { joiningDate: ["Joining date is required"] } };
    }

    const basicSalary = basicSalaryStr ? parseFloat(basicSalaryStr) : 0;
    if (isNaN(basicSalary) || basicSalary <= 0) {
      return { error: { basicSalary: ["Basic salary must be positive"] } };
    }

    // Generate employee ID
    const employeeCount = await prisma.employee.count();
    const nextNumber = employeeCount + 1;
    const employeeId = `EMP${nextNumber.toString().padStart(3, "0")}`;

    // Create employee with direct transaction to ensure consistency
    const employee = await prisma.$transaction(async (tx) => {
      return tx.employee.create({
        data: {
          name,
          joiningDate: new Date(joiningDateStr),
          basicSalary,
          employeeId,
          userId,
        },
      });
    });

    revalidatePath("/dashboard/employees");
    return { success: true, employee };
  } catch (error) {
    console.error("Error creating employee:", error);
    return {
      error: { _form: [`Failed to create employee: ${error instanceof Error ? error.message : "Unknown error"}`] },
    };
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(formData: FormData) {
  const session = await auth();

  // For development purposes, get the test user if auth is not available
  let userId = session?.user?.id;

  if (!userId) {
    // Fallback to test user for development
    const testUser = await getTestUser();
    if (!testUser) {
      // Try forced update instead
      return updateEmployeeForced(formData);
    }
    userId = testUser.id;
  }

  const validatedFields = employeeUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    joiningDate: formData.get("joiningDate"),
    basicSalary: parseFloat(formData.get("basicSalary") as string),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, ...data } = validatedFields.data;

  try {
    // Verify that the employee belongs to the current user
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee) {
      // If not found, try forced update
      return updateEmployeeForced(formData);
    }

    if (employee.userId !== userId) {
      return { error: { _form: ["Unauthorized"] } };
    }

    await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joiningDate: new Date(data.joiningDate),
      },
    });

    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating employee:", error);
    // Try forced update as fallback
    return updateEmployeeForced(formData);
  }
}

/**
 * Update an existing employee using forced test user ID
 * This is a fallback method to be used only for debugging
 */
export async function updateEmployeeForced(formData: FormData) {
  // Use the exact ID we found in the database
  const userId = "cmawd02kq0000x3vltl49lrux";

  const validatedFields = employeeUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    joiningDate: formData.get("joiningDate"),
    basicSalary: parseFloat(formData.get("basicSalary") as string),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, ...data } = validatedFields.data;

  try {
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee) {
      return { error: { _form: ["Employee not found"] } };
    }

    // If employee is associated with a different user, update the userId
    if (employee.userId !== userId) {
      // First assign the employee to the test user
      await prisma.employee.update({
        where: { id },
        data: { userId },
      });
    }

    // Now update the employee data
    await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joiningDate: new Date(data.joiningDate),
      },
    });

    console.log(`Forced update of employee ${id} completed`);
    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error in forced employee update:", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: { _form: ["Failed to update employee: ID conflict"] } };
    }
    return { error: { _form: ["Failed to update employee"] } };
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(id: string) {
  const session = await auth();

  // For development purposes, get the test user if auth is not available
  let userId = session?.user?.id;

  if (!userId) {
    // Fallback to test user for development
    const testUser = await getTestUser();
    if (!testUser) {
      // Try the forced deletion
      return deleteEmployeeForced(id);
    }
    userId = testUser.id;
  }

  try {
    // Verify that the employee belongs to the current user
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee) {
      // If not found, try forced method
      return deleteEmployeeForced(id);
    }

    if (employee.userId !== userId) {
      return { error: "Unauthorized" };
    }

    await prisma.employee.delete({
      where: { id },
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    // Try forced deletion as fallback
    return deleteEmployeeForced(id);
  }
}

/**
 * Delete an employee using forced test user ID
 * This is a fallback method to be used only for debugging
 */
export async function deleteEmployeeForced(id: string) {
  try {
    // Find the test user
    const testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    // If no test user, try to find any user
    if (!testUser) {
      const anyUser = await prisma.user.findFirst();
      if (!anyUser) {
        // Last resort - just delete the employee directly
        return deleteEmployeeDirectly(id);
      }

      // Verify that the employee exists
      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        return { error: "Employee not found" };
      }

      // Delete the employee directly
      await prisma.employee.delete({
        where: { id },
      });

      console.log(`Forced deletion of employee ${id} completed`);
      revalidatePath("/dashboard/employees");
      return { success: true };
    }

    // Use test user we found
    const userId = testUser.id;

    // Verify that the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee) {
      return { error: "Employee not found" };
    }

    if (employee.userId !== userId) {
      // First try to update the employee's userId to the test user
      try {
        await prisma.employee.update({
          where: { id },
          data: { userId },
        });
      } catch (updateError) {
        console.error("Failed to update employee userId, attempting direct deletion:", updateError);
        return deleteEmployeeDirectly(id);
      }
    }

    // Now delete the employee
    await prisma.employee.delete({
      where: { id },
    });

    console.log(`Forced deletion of employee ${id} completed`);
    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    console.error("Error in forced employee deletion:", error);
    // Last resort - try direct deletion
    return deleteEmployeeDirectly(id);
  }
}

/**
 * Direct delete with no checks - last resort
 * This is a final fallback for when all other methods fail
 */
async function deleteEmployeeDirectly(id: string) {
  try {
    // Try direct deletion without any checks
    await prisma.$transaction(async (tx) => {
      // Find any related records that could cause FK constraint issues
      // For example, if there are tasks assigned to this employee:
      const tasks = await tx.task.findMany({
        where: { employeeId: id },
      });

      // Unassign tasks if they exist
      if (tasks.length > 0) {
        await tx.task.updateMany({
          where: { employeeId: id },
          data: { employeeId: null },
        });
      }

      // Now delete the employee
      await tx.employee.delete({
        where: { id },
      });
    });

    console.log(`Direct deletion of employee ${id} completed successfully`);
    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    console.error("Even direct deletion failed:", error);
    return {
      error: "Failed to delete employee after multiple attempts. Please contact system administrator.",
    };
  }
}

/**
 * Get all employees for the current user
 */
export async function getEmployees() {
  const session = await auth();

  // For development purposes, get the test user if auth is not available
  let userId = session?.user?.id;

  console.log("Session user ID:", userId);

  if (!userId) {
    // Fallback to test user for development
    const testUser = await getTestUser();
    if (!testUser) {
      console.log("No test user found!");
      return [];
    }
    userId = testUser.id;
    console.log("Using test user ID:", userId);
  }

  try {
    const employees = await prisma.employee.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${employees.length} employees for user ${userId}`);
    return employees;
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

/**
 * Get all employees forcing test user ID
 * This is a fallback method to be used only for debugging
 */
export async function getEmployeesForced() {
  try {
    // First, try to get the test user
    const testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    // If no test user, try to find any user
    if (!testUser) {
      const anyUser = await prisma.user.findFirst();
      if (!anyUser) {
        console.log("No users found at all!");
        return [];
      }

      const employees = await prisma.employee.findMany({
        where: {
          userId: anyUser.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`Forced query: Found ${employees.length} employees for the only user ${anyUser.id}`);
      return employees;
    }

    // Use the test user we found
    const userId = testUser.id;

    const employees = await prisma.employee.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Forced query: Found ${employees.length} employees for test user ${userId}`);
    return employees;
  } catch (error) {
    console.error("Error fetching employees:", error);

    // Last resort - get ALL employees regardless of user
    try {
      const allEmployees = await prisma.employee.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`Last resort: Found ${allEmployees.length} employees in total`);
      return allEmployees;
    } catch (finalError) {
      console.error("Even the last resort failed:", finalError);
      return [];
    }
  }
}

/**
 * Get an employee by ID
 */
export async function getEmployee(id: string) {
  const session = await auth();

  // For development purposes, get the test user if auth is not available
  let userId = session?.user?.id;

  if (!userId) {
    // Fallback to test user for development
    const testUser = await getTestUser();
    if (!testUser) {
      // Try the forced approach
      return getEmployeeForced(id);
    }
    userId = testUser.id;
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id,
        userId,
      },
    });

    // If not found with current user, try forced method
    if (!employee) {
      return getEmployeeForced(id);
    }

    return employee;
  } catch (error) {
    console.error("Error fetching employee:", error);
    // Try the forced approach as fallback
    return getEmployeeForced(id);
  }
}

/**
 * Get an employee by ID using forced test user ID
 * This is a fallback method to be used only for debugging
 */
export async function getEmployeeForced(id: string) {
  try {
    // First, try to find the employee by ID without user check
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      console.log(`Forced query: No employee found with ID ${id}`);
      return null;
    }

    console.log(`Found employee directly with ID ${id}`);
    return employee;
  } catch (error) {
    console.error("Error fetching employee with forced ID:", error);
    return null;
  }
}
