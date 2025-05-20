import { getEmployee, getEmployeeForced } from "@/lib/actions/employee";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Try normal fetch first
    let employee = await getEmployee(params.id);

    // If not found, try forced fetch
    if (!employee) {
      employee = await getEmployeeForced(params.id);
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // First, clean up any related records
    await prisma.$transaction(async (tx) => {
      // Unassign any tasks
      await tx.task.updateMany({
        where: { employeeId: id },
        data: { employeeId: null },
      });

      // Delete the employee directly
      await tx.employee.delete({
        where: { id },
      });
    });

    revalidatePath("/dashboard/employees");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
