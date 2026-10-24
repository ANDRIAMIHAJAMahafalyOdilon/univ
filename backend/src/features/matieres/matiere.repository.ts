import { prisma } from "../../database/prisma";
import { z } from "zod";
import { matiereSchema } from "./matiere.schema";

type MatierePayload = z.infer<typeof matiereSchema>;

export const matiereRepository = {
  list: () =>
    prisma.matiere.findMany({
      where: { statut: "Actif" },
      include: {
        module: { select: { id_module: true, code_module: true, nom_module: true, semestre: true } },
        _count: { select: { enseignants: true } },
      },
      orderBy: { nom: "asc" },
    }),
  create: (data: MatierePayload) => prisma.matiere.create({ data }),
  update: (id: string, data: MatierePayload) => prisma.matiere.update({ where: { id }, data }),
  softDelete: (id: string) => prisma.matiere.update({ where: { id }, data: { statut: "Supprime" } }),
};