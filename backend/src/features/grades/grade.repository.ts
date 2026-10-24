import { prisma } from "../../database/prisma";
import { TypeEvaluation } from "../../generated/prisma/enums";

export const gradeRepository = {
  list: (filters?: { id_etudiant?: string }) =>
    prisma.note.findMany({
      where: { statut: "Valide", ...(filters?.id_etudiant ? { id_etudiant: filters.id_etudiant } : {}) },
      include: { etudiant: true, module: true },
      orderBy: { date_saisie: "desc" },
    }),
  create: (data: {
    id_etudiant: string;
    id_module: string;
    note_obtenue: number;
    type_evaluation: TypeEvaluation;
    date_saisie: string;
  }) => prisma.note.create({ data }),
  softDelete: (id: string) => prisma.note.update({ where: { id_note: id }, data: { statut: "Supprimee" } }),
};
