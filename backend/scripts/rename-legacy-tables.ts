import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function renameIfExists(from: string, to: string) {
  const rows = (await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    from
  )) as Array<{ name: string }>;
  if (rows.length > 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${from}" RENAME TO "${to}"`);
  }
}

async function main() {
  await renameIfExists("Etudiant", "etudiant");
  await renameIfExists("Enseignant", "enseignant");
  await renameIfExists("Module", "module");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
