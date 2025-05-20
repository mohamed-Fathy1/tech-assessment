import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await request.json();

    // Update employee with minimal complexity
    await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        joiningDate: new Date(data.joiningDate),
        basicSalary: parseFloat(data.basicSalary),
      },
    });

    revalidatePath("/dashboard/employees");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
