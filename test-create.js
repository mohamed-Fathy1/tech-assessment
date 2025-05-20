import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  try {
    // Find test user
    const testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (!testUser) {
      console.error("Test user not found");
      return;
    }

    // Generate employee ID
    const employeeCount = await prisma.employee.count();
    const nextNumber = employeeCount + 1;
    const employeeId = `EMP${nextNumber.toString().padStart(3, "0")}`;

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        name: "Test Terminal Employee",
        joiningDate: new Date(),
        basicSalary: 6500,
        employeeId: employeeId,
        userId: testUser.id,
      },
    });

    console.log("Successfully created:", employee);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
