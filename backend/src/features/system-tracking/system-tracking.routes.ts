import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../database/prisma";
import { clampLimit } from "../../lib/utils/helpers";

export async function systemTrackingRoutes(app: FastifyInstance) {
  app.get("/audit-logs", async (request, reply: FastifyReply) => {
    const q = request.query as {
      action?: string;
      table?: string;
      userId?: string;
      search?: string;
      limit?: string;
    };
    const limit = clampLimit(q.limit, 500, 2000);
    const rows = await prisma.auditLog.findMany({
      where: {
        ...(q.action ? { action: q.action } : {}),
        ...(q.table ? { table_cible: q.table } : {}),
        ...(q.userId ? { user_id: q.userId } : {}),
        ...(q.search
          ? {
              OR: [
                { action: { contains: q.search } },
                { table_cible: { contains: q.search } },
                { details: { contains: q.search } },
              ],
            }
          : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, nom: true, prenom: true, role: true },
        },
      },
    });
    return reply.send(rows);
  });

  app.delete("/audit-logs", async (request, reply: FastifyReply) => {
    const q = request.query as { before?: string };
    if (q.before) {
      const date = new Date(q.before);
      await prisma.auditLog.deleteMany({
        where: { created_at: { lt: date } },
      });
    } else {
      await prisma.auditLog.deleteMany({});
    }
    return reply.status(204).send();
  });

  app.get("/notifications", async (request, reply: FastifyReply) => {
    const q = request.query as {
      lu?: string;
      type?: string;
      userId?: string;
      limit?: string;
    };
    const limit = clampLimit(q.limit, 500, 2000);
    const rows = await prisma.notification.findMany({
      where: {
        ...(q.lu === "true" ? { lu: true } : {}),
        ...(q.lu === "false" ? { lu: false } : {}),
        ...(q.type ? { type: q.type as any } : {}),
        ...(q.userId ? { user_id: q.userId } : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, nom: true, prenom: true, role: true },
        },
        etudiant: { select: { id_etudiant: true, nom_etudiant: true, prenom_etudiant: true } },
        enseignant: { select: { id_enseignant: true, nom_enseignant: true, prenom_enseignant: true } },
      },
    });
    return reply.send(rows);
  });

  app.post("/notifications", async (request, reply: FastifyReply) => {
    const body = request.body as {
      type: "Info" | "Alerte" | "Systeme";
      titre: string;
      message: string;
      user_id?: string;
      etudiant_id?: string;
      enseignant_id?: string;
    };
    const created = await prisma.notification.create({
      data: {
        type: body.type,
        titre: body.titre,
        message: body.message,
        user_id: body.user_id || null,
        etudiant_id: body.etudiant_id || null,
        enseignant_id: body.enseignant_id || null,
      },
    });
    return reply.status(201).send(created);
  });

  app.put(
    "/notifications/:id/read",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const body = request.body as { lu: boolean };
      const updated = await prisma.notification.updateMany({
        where: { id: request.params.id },
        data: { lu: body.lu },
      });
      if (updated.count === 0) {
        return reply.status(404).send({ error: "Notification introuvable" });
      }
      const row = await prisma.notification.findUnique({ where: { id: request.params.id } });
      return reply.send(row);
    }
  );

  app.delete(
    "/notifications/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await prisma.notification.deleteMany({ where: { id: request.params.id } });
      return reply.status(204).send();
    }
  );
}

