import { PrismaClient } from "@/lib/generated/prisma/client";
import sampleData from "./sample-data";

async function main() {
  const prisma = new PrismaClient();
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding database...");

  await prisma.product.createMany({ data: sampleData.products });
  await prisma.user.createMany({ data: sampleData.users });

  console.log("Database seeded successfully.");
}

main();

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// }).finally(async () => {
//   const prisma = new PrismaClient();
//   await prisma.$disconnect();
// });
