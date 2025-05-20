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

    // Get all employees
    const employees = await prisma.employee.findMany({
      where: {
        userId: testUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${employees.length} employees:`);
    employees.forEach((emp) => {
      console.log(`- ${emp.employeeId}: ${emp.name} - Salary: $${emp.basicSalary}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
