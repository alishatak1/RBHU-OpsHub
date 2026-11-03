import "dotenv/config";
import { prisma } from "../src/config/prisma";

async function main() {
  const admins = await prisma.admin.findMany({
    select: { id: true, name: true, email: true, isActive: true }
  });

  console.table(admins);
}

main()
  .catch(error => console.error(error.message))
  .finally(async () => await prisma.$disconnect());
