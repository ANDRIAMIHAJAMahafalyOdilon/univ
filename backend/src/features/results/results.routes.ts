import { FastifyInstance } from "fastify";
import { prisma } from "../../database/prisma";

const decisionFor = (average: number) =>
  average >= 10 ? "Admis" : average >= 8 ? "Redoublement" : "Ajourne";

const mentionFor = (average: number) => {
  if (average >= 18) return { mention: "Excellence" as const, note_min: 18, note_max: 20 };
  if (average >= 16) return { mention: "Tres_Bien" as const, note_min: 16, note_max: 17.99 };
  if (average >= 14) return { mention: "Bien" as const, note_min: 14, note_max: 15.99 };
  if (average >= 12) return { mention: "Assez_Bien" as const, note_min: 12, note_max: 13.99 };
  if (average >= 10) return { mention: "Passable" as const, note_min: 10, note_max: 11.99 };
  return null;
};

const includeResult = {
  etudiant: { select: { id_etudiant: true, numero_matricule: true, nom_etudiant: true, prenom_etudiant: true } },
  note: { include: { module: { select: { id_module: true, code_module: true, nom_module: true, coefficient_module: true, credits_ects: true } } } },
  decision_jury: true,
  mention: true,
} as const;

export async function resultsRoutes(app: FastifyInstance) {
  app.get("/deliberations", async (_request, reply) => {
    const rows = await prisma.deliberation.findMany({
      include: includeResult,
      orderBy: { date_deliberation: "desc" },
    });
    return reply.send(rows);
  });

  app.get("/decisions-jury", async (_request, reply) => {
    const rows = await prisma.decisionJury.findMany({
      include: { deliberation: { include: includeResult } },
      orderBy: { date_decision: "desc" },
    });
    return reply.send(rows);
  });

  app.get("/mentions", async (_request, reply) => {
    const rows = await prisma.mention.findMany({
      include: { deliberation: { include: includeResult } },
      orderBy: { deliberation: { date_deliberation: "desc" } },
    });
    return reply.send(rows);
  });

  app.post("/deliberations/generate", async (_request, reply) => {
    const notes = await prisma.note.findMany({
      where: { statut: "Valide", etudiant: { statut: { not: "Supprime" } }, module: { statut: "Actif" } },
      include: { module: true },
      orderBy: { date_saisie: "desc" },
    });
    const groups = new Map<string, typeof notes>();
    for (const note of notes) {
      const key = `${note.id_etudiant}:${note.id_module}`;
      groups.set(key, [...(groups.get(key) ?? []), note]);
    }

    const generated = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const group of groups.values()) {
        const representative = group[0];
        const average = Number((group.reduce((sum, note) => sum + note.note_obtenue, 0) / group.length).toFixed(2));
        const previous = await tx.deliberation.findFirst({
          where: { etudiant_id: representative.id_etudiant, note: { id_module: representative.id_module } },
          orderBy: { date_deliberation: "desc" },
        });
        const deliberation = previous
          ? await tx.deliberation.update({
              where: { id: previous.id },
              data: { note_id: representative.id_note, moyenne_generale: average, est_valide: true, date_deliberation: new Date() },
            })
          : await tx.deliberation.create({
              data: { etudiant_id: representative.id_etudiant, note_id: representative.id_note, moyenne_generale: average, est_valide: true },
            });

        await tx.decisionJury.upsert({
          where: { deliberation_id: deliberation.id },
          create: { deliberation_id: deliberation.id, decision: decisionFor(average) },
          update: { decision: decisionFor(average), commentaire: null, date_decision: new Date() },
        });

        const mention = mentionFor(average);
        if (mention) {
          await tx.mention.upsert({
            where: { deliberation_id: deliberation.id },
            create: { deliberation_id: deliberation.id, ...mention },
            update: mention,
          });
        } else {
          await tx.mention.deleteMany({ where: { deliberation_id: deliberation.id } });
        }
        count += 1;
      }
      return count;
    });

    const rows = await prisma.deliberation.findMany({ include: includeResult, orderBy: { date_deliberation: "desc" } });
    return reply.send({ generated, deliberations: rows });
  });
}
