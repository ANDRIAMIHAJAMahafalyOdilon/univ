import { prisma } from "../../database/prisma";
import { StudentPayload } from "./student.types";

export const studentRepository = {
  list: () =>
    prisma.etudiant.findMany({
      where: { statut: { not: "Supprime" } },
      include: {
        parcours: { select: { id: true, code: true, nom: true } },
        niveau: { select: { id: true, code: true, nom: true } },
      },
      orderBy: [{ nom_etudiant: "asc" }, { prenom_etudiant: "asc" }],
    }),
  findById: (id: string) =>
    prisma.etudiant.findFirst({
      where: { id_etudiant: id, statut: { not: "Supprime" } },
      include: {
        parcours: { select: { id: true, code: true, nom: true, description: true } },
        niveau: { select: { id: true, code: true, nom: true } },
      },
    }),
  create: (data: StudentPayload) => prisma.etudiant.create({ data }),
  update: (id: string, data: StudentPayload) =>
    prisma.etudiant.update({ where: { id_etudiant: id }, data }),
  softDelete: (id: string) =>
    prisma.etudiant.updateMany({ where: { id_etudiant: id }, data: { statut: "Supprime" } }),
};
