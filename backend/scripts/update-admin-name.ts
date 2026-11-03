import "dotenv/config";
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { prisma } from "../src/config/prisma";

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const email = (await rl.question("Administrator email: ")).trim().toLowerCase();
    const name = (await rl.question("Correct admin name: ")).trim();

    if (name.length < 2 || name.length > 100) {
      throw new Error("Name must contain 2–100 characters.");
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) throw new Error("Administrator account not found.");

    await prisma.admin.update({
      where: { email },
      data: { name }
    });

    console.log("Administrator name updated successfully.");
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error("Update failed:", error.message);
  process.exitCode = 1;
});
