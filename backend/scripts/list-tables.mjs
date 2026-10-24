import { PrismaClient } from "../src/generated/prisma/client.ts";

const prisma = new PrismaClient();

const rows = await prisma.$queryRawUnsafe(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);

console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
