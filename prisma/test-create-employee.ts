import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateEmployeeId() {
  // Get the count of existing employees to determine the next number
  const employeeCount = await prisma.employee.count();
  const nextNumber = employeeCount + 1;

  // Format: EMP + padded number (e.g., EMP001, EMP012, EMP123)
  return `EMP${nextNumber.toString().padStart(3, "0")}`;
}

async function main() {
  try {
    // Find the test user first
    const testUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (!testUser) {
      console.error("Test user not found! Please run 'npx prisma db seed' first.");
      return;
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId();

    // Create employee directly
    const employee = await prisma.employee.create({
      data: {
        name: "Test Employee",
        joiningDate: new Date(),
        basicSalary: 5000,
        employeeId: employeeId,
        userId: testUser.id,
      },
    });

    console.log("Successfully created employee:");
    console.log(employee);
  } catch (error) {
    console.error("Error creating employee:");
    console.error(error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
