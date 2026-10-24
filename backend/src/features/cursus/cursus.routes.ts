import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../database/prisma";
import { AppError } from "../../core/errors/AppError";
import { anneeUpsertSchema, niveauUpsertSchema, parcoursUpsertSchema } from "./cursus.schema";

/** Overview stats + navigation helpers */
async function overviewHandler(_request: FastifyRequest, reply: FastifyReply) {
  const [totalParcours, totalNiveaux, totalModules, totalAnnees, activeAnnee] = await Promise.all([
    prisma.parcours.count({ where: { statut: "Actif" } }),
    prisma.niveau.count({ where: { statut: "Actif" } }),
    prisma.module.count({ where: { statut: "Actif" } }),
    prisma.anneeUniversitaire.count({ where: { statut: "Actif" } }),
    prisma.anneeUniversitaire.findFirst({ where: { est_active: true, statut: "Actif" } }),
  ]);
  return reply.send({
    totalParcours,
    totalNiveaux,
    totalModules,
    totalAnnees,
    activeAnneeLibelle: activeAnnee?.libelle ?? null,
    activeAnneeId: activeAnnee?.id ?? null,
  });
}

/** Legacy read endpoints (dropdowns / forms) */
async function academicAnneesLegacy(_request: FastifyRequest, reply: FastifyReply) {
  const rows = await prisma.anneeUniversitaire.findMany({
    where: { statut: "Actif" },
    orderBy: { created_at: "desc" },
  });
  return reply.send(rows);
}

async function academicParcoursLegacy(_request: FastifyRequest, reply: FastifyReply) {
  const rows = await prisma.parcours.findMany({
    where: { statut: "Actif" },
    orderBy: { nom: "asc" },
  });
  return reply.send(rows);
}

async function academicNiveauxLegacy(request: FastifyRequest, reply: FastifyReply) {
  const parcoursId = (request.query as { parcoursId?: string }).parcoursId;
  const rows = await prisma.niveau.findMany({
    where: {
      statut: "Actif",
      ...(parcoursId ? { parcours_id: parcoursId } : {}),
    },
    orderBy: { nom: "asc" },
    include: { parcours: { select: { id: true, code: true, nom: true } } },
  });
  return reply.send(rows);
}

export async function cursusRoutes(app: FastifyInstance) {
  app.get("/cursus/overview", overviewHandler);

  app.get("/academic/annees", academicAnneesLegacy);
  app.get("/academic/parcours", academicParcoursLegacy);
  app.get("/academic/niveaux", academicNiveauxLegacy);

  app.get("/cursus/annees-universitaires", async (request, reply) => {
    const all = (request.query as { all?: string }).all === "1";
    const rows = await prisma.anneeUniversitaire.findMany({
      where: all ? {} : { statut: "Actif" },
      orderBy: { created_at: "desc" },
    });
    return reply.send(rows);
  });

  app.post("/cursus/annees-universitaires", async (request, reply) => {
    const body = anneeUpsertSchema.parse(request.body);
    const { est_active, statut, ...rest } = body;
    const statutFinal = statut ?? "Actif";
    if (est_active) {
      const created = await prisma.$transaction(async (tx) => {
        await tx.anneeUniversitaire.updateMany({ where: {}, data: { est_active: false } });
        return tx.anneeUniversitaire.create({
          data: { ...rest, statut: statutFinal, est_active: true },
        });
      });
      return reply.status(201).send(created);
    }
    const created = await prisma.anneeUniversitaire.create({
      data: { ...rest, statut: statutFinal, est_active: false },
    });
    return reply.status(201).send(created);
  });

  app.put("/cursus/annees-universitaires/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const body = anneeUpsertSchema.partial().parse(request.body);
    const { est_active, statut, ...rest } = body;
    const statutFinal = statut ?? undefined;
    try {
      if (est_active === true) {
        await prisma.$transaction([
          prisma.anneeUniversitaire.updateMany({ where: {}, data: { est_active: false } }),
          prisma.anneeUniversitaire.update({
            where: { id },
            data: { ...rest, est_active: true, statut: "Actif" },
          }),
        ]);
      } else {
        await prisma.anneeUniversitaire.update({
          where: { id },
          data: {
            ...rest,
            ...(est_active === false ? { est_active: false } : {}),
            ...(statutFinal ? { statut: statutFinal } : {}),
          },
        });
      }
      const updated = await prisma.anneeUniversitaire.findUnique({ where: { id } });
      if (!updated) throw new AppError(404, "Année universitaire introuvable");
      return reply.send(updated);
    } catch {
      throw new AppError(404, "Année universitaire introuvable");
    }
  });

  app.delete("/cursus/annees-universitaires/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    try {
      await prisma.anneeUniversitaire.update({ where: { id }, data: { statut: "Supprime" } });
      return reply.status(204).send();
    } catch {
      throw new AppError(404, "Année universitaire introuvable");
    }
  });

  app.post("/cursus/annees-universitaires/:id/activate", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await prisma.$transaction([
      prisma.anneeUniversitaire.updateMany({ where: {}, data: { est_active: false } }),
      prisma.anneeUniversitaire.update({
        where: { id },
        data: { est_active: true, statut: "Actif" },
      }),
    ]);
    const row = await prisma.anneeUniversitaire.findUnique({ where: { id } });
    if (!row) throw new AppError(404, "Année universitaire introuvable");
    return reply.send(row);
  });

  app.get("/cursus/parcours", async (request, reply) => {
    const all = (request.query as { all?: string }).all === "1";
    const rows = await prisma.parcours.findMany({
      where: all ? {} : { statut: "Actif" },
      orderBy: { nom: "asc" },
      include: {
        responsable: {
          select: { id_enseignant: true, nom_enseignant: true, prenom_enseignant: true, departement: true },
        },
        institution: { select: { id: true, nom: true, sigle: true } },
        _count: { select: { niveaux: true, modules: true, etudiants: true } },
      },
    });
    return reply.send(rows);
  });

  app.post("/cursus/parcours", async (request, reply) => {
    const body = parcoursUpsertSchema.parse(request.body);
    const created = await prisma.parcours.create({
      data: { ...body, statut: "Actif" },
    });
    return reply.status(201).send(created);
  });

  app.put("/cursus/parcours/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const body = parcoursUpsertSchema.partial().parse(request.body);
    try {
      const updated = await prisma.parcours.update({ where: { id }, data: body });
      return reply.send(updated);
    } catch {
      throw new AppError(404, "Parcours introuvable");
    }
  });

  app.delete("/cursus/parcours/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    try {
      await prisma.parcours.update({ where: { id }, data: { statut: "Supprime" } });
      return reply.status(204).send();
    } catch {
      throw new AppError(404, "Parcours introuvable");
    }
  });

  app.get("/cursus/niveaux", async (request, reply) => {
    const all = (request.query as { all?: string }).all === "1";
    const parcoursId = (request.query as { parcoursId?: string }).parcoursId;
    const rows = await prisma.niveau.findMany({
      where: {
        ...(all ? {} : { statut: "Actif" }),
        ...(parcoursId ? { parcours_id: parcoursId } : {}),
      },
      orderBy: { nom: "asc" },
      include: {
        parcours: { select: { id: true, code: true, nom: true } },
        annee_universitaire: { select: { id: true, libelle: true } },
      },
    });
    return reply.send(rows);
  });

  app.post("/cursus/niveaux", async (request, reply) => {
    const body = niveauUpsertSchema.parse(request.body);
    const created = await prisma.niveau.create({
      data: { ...body, statut: "Actif" },
    });
    return reply.status(201).send(created);
  });

  app.put("/cursus/niveaux/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const body = niveauUpsertSchema.partial().parse(request.body);
    try {
      const updated = await prisma.niveau.update({ where: { id }, data: body });
      return reply.send(updated);
    } catch {
      throw new AppError(404, "Niveau introuvable");
    }
  });

  app.delete("/cursus/niveaux/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    try {
      await prisma.niveau.update({ where: { id }, data: { statut: "Supprime" } });
      return reply.status(204).send();
    } catch {
      throw new AppError(404, "Niveau introuvable");
    }
  });

  app.get("/cursus/parcours/:id/detail", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const parcours = await prisma.parcours.findFirst({
      where: { id, statut: "Actif" },
      include: {
        responsable: {
          select: { id_enseignant: true, nom_enseignant: true, prenom_enseignant: true, departement: true },
        },
        niveaux: { where: { statut: "Actif" } },
        modules: {
          where: { statut: "Actif" },
          include: { enseignant: true, niveau: { select: { id: true, code: true, nom: true } } },
        },
        etudiants: { where: { statut: { not: "Supprime" } }, take: 500 },
      },
    });
    if (!parcours) throw new AppError(404, "Parcours introuvable");
    return reply.send(parcours);
  });

  app.get("/cursus/modules/:id/detail", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const mod = await prisma.module.findFirst({
      where: { id_module: id, statut: "Actif" },
      include: {
        enseignant: true,
        notes: {
          where: { statut: "Valide" },
          take: 200,
          include: { etudiant: true },
        },
      },
    });
    if (!mod) throw new AppError(404, "Module introuvable");
    return reply.send(mod);
  });
}
