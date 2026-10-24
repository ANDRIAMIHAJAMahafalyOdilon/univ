import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "../src/lib/crypto/hash";

const prisma = new PrismaClient();

async function main() {
  await prisma.institution.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nom: "Université UniNotes",
      sigle: "UNINOTES",
      email_contact: "contact@univ.local",
      description: "Établissement par défaut (mode mono-université).",
      statut: "Active",
    },
  });

  const password = await hash("admin123");
  await prisma.users.upsert({
    where: { email: "admin@univ.local" },
    update: { password },
    create: {
      email: "admin@univ.local",
      nom: "Admin",
      prenom: "Systeme",
      password,
      role: "admin",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });