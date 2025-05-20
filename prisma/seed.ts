import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@example.com",
      emailVerified: new Date(),
    },
  });

  console.log({ testUser });
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
