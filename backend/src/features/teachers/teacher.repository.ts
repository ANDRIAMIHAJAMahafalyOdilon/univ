import { prisma } from "../../database/prisma";
import { z } from "zod";
import { teacherSchema } from "./teacher.schema";
import type { Prisma } from "../../generated/prisma/client";

type TeacherPayload = z.infer<typeof teacherSchema>;

export const teacherRepository = {
  list: () =>
    prisma.enseignant.findMany({
      where: { statut: "Actif" },
      orderBy: { nom_enseignant: "asc" },
      include: {
        _count: { select: { modules: true, matieres: true } },
      },
    }),
  findById: (id: string) =>
    prisma.enseignant.findFirst({
      where: { id_enseignant: id, statut: "Actif" },
      include: {
        modules: { where: { statut: "Actif" }, orderBy: { nom_module: "asc" } },
        matieres: { include: { matiere: true } },
      },
    }),
  create: (data: TeacherPayload) => prisma.enseignant.create({ data }),
  update: (id: string, data: Prisma.EnseignantUpdateInput) =>
    prisma.enseignant.update({ where: { id_enseignant: id }, data }),
  softDelete: (id: string) =>
    prisma.enseignant.update({ where: { id_enseignant: id }, data: { statut: "Supprime" } }),
};
