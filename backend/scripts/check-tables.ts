import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log(rows.map((r) => r.name).join("\n"));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
