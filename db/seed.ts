import { PrismaClient } from "@prisma/client";
import sampleData from "./sample-data";

async function main() {
  const prisma = new PrismaClient();
  await prisma.product.deleteMany();

  console.log("Seeding database...");

  await prisma.product.createMany({ data: sampleData.products });
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
