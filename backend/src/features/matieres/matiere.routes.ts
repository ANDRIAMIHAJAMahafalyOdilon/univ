import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../core/errors/AppError";
import {
  createMatiereHandler,
  deleteMatiereHandler,
  listMatieresHandler,
  updateMatiereHandler,
} from "./matiere.handler";

export async function matiereRoutes(app: FastifyInstance) {
  app.get("/enseignant-matieres", async (_request, reply) => {
    const rows = await prisma.enseignantMatiere.findMany({
      include: {
        enseignant: { select: { id_enseignant: true, nom_enseignant: true, prenom_enseignant: true, departement: true } },
        matiere: { include: { module: { select: { id_module: true, code_module: true, nom_module: true } } } },
      },
      orderBy: { created_at: "desc" },
    });
    return reply.send(rows);
  });
  app.post("/enseignant-matieres", async (request, reply) => {
    const body = z.object({ enseignant_id: z.string().min(1), matiere_id: z.string().min(1) }).parse(request.body);
    const row = await prisma.enseignantMatiere.create({
      data: body,
      include: {
        enseignant: { select: { id_enseignant: true, nom_enseignant: true, prenom_enseignant: true, departement: true } },
        matiere: { include: { module: { select: { id_module: true, code_module: true, nom_module: true } } } },
      },
    });
    return reply.status(201).send(row);
  });
  app.delete("/enseignant-matieres/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await prisma.enseignantMatiere.deleteMany({ where: { id } });
    if (!deleted.count) throw new AppError(404, "Attribution introuvable");
    return reply.status(204).send();
  });
  app.get("/matieres", listMatieresHandler);
  app.post("/matieres", createMatiereHandler);
  app.put("/matieres/:id", updateMatiereHandler);
  app.delete("/matieres/:id", deleteMatiereHandler);
}
