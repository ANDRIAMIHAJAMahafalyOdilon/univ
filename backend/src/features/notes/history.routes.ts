import { FastifyInstance } from "fastify";
import { prisma } from "../../database/prisma";
import { clampLimit } from "../../lib/utils/helpers";

export async function noteHistoryRoutes(app: FastifyInstance) {
  app.get("/note-history", async (request, reply) => {
    const q = request.query as { studentId?: string; moduleId?: string; limit?: string };
    const limit = clampLimit(q.limit, 200, 1000);
    const rows = await prisma.noteHistory.findMany({
      where: {
        ...(q.studentId
          ? { note: { id_etudiant: q.studentId } }
          : {}),
        ...(q.moduleId
          ? { note: { id_module: q.moduleId } }
          : {}),
      },
      orderBy: { date_modif: "desc" },
      take: limit,
      include: {
        note: {
          include: {
            etudiant: true,
            module: true,
          },
        },
      },
    });
    return reply.send(rows);
  });
}

