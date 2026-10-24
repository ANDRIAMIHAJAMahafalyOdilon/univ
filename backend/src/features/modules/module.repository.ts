import { prisma } from "../../database/prisma";
import { z } from "zod";
import { moduleSchema } from "./module.schema";

type ModulePayload = z.infer<typeof moduleSchema>;

export const moduleRepository = {
  list: () =>
    prisma.module.findMany({
      where: { statut: "Actif" },
      orderBy: { nom_module: "asc" },
      include: {
        enseignant: true,
        niveau: { select: { id: true, code: true, nom: true } },
        parcours: { select: { id: true, code: true, nom: true } },
      },
    }),
  create: (data: ModulePayload) => prisma.module.create({ data }),
  update: (id: string, data: ModulePayload) => prisma.module.update({ where: { id_module: id }, data }),
  softDelete: (id: string) => prisma.module.update({ where: { id_module: id }, data: { statut: "Supprime" } }),
};
