import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../core/errors/AppError";
import { prisma } from "../../database/prisma";
import { sessionSchema } from "./sessions.schema";

export async function sessionExamenRoutes(app: FastifyInstance) {
  app.get("/sessions-examen", async (_req, reply: FastifyReply) => {
    const rows = await prisma.sessionExamen.findMany({
      where: { statut: "Actif" },
      orderBy: { date_debut: "desc" },
      include: { annee_universitaire: true },
    });
    return reply.send(rows);
  });

  app.get(
    "/sessions-examen/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const row = await prisma.sessionExamen.findFirst({
        where: { id: req.params.id, statut: "Actif" },
        include: { annee_universitaire: true, notes: { where: { statut: "Valide" } } },
      });
      if (!row) throw new AppError(404, "Session introuvable");
      return reply.send(row);
    }
  );

  app.post("/sessions-examen", async (req, reply) => {
    const body = sessionSchema.parse(req.body);
    const created = await prisma.sessionExamen.create({
      data: { ...body, statut: "Actif" },
    });
    return reply.status(201).send(created);
  });

  app.put(
    "/sessions-examen/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const body = sessionSchema.partial().parse(req.body);
      try {
        const updated = await prisma.sessionExamen.update({
          where: { id: req.params.id },
          data: body,
        });
        return reply.send(updated);
      } catch {
        throw new AppError(404, "Session introuvable");
      }
    }
  );

  app.delete(
    "/sessions-examen/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await prisma.sessionExamen.update({
          where: { id: req.params.id },
          data: { statut: "Supprime" },
        });
        return reply.status(204).send();
      } catch {
        throw new AppError(404, "Session introuvable");
      }
    }
  );
}

