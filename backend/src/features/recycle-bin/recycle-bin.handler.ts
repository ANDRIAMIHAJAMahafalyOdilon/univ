import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../core/errors/AppError";
import { prisma } from "../../database/prisma";
import type { Prisma } from "../../generated/prisma/client";

const TRASH_ENTITIES = ["etudiants", "enseignants", "modules", "notes"] as const;
type TrashEntity = (typeof TRASH_ENTITIES)[number];

function assertTrashEntity(entity: string): asserts entity is TrashEntity {
  if (!(TRASH_ENTITIES as readonly string[]).includes(entity)) {
    throw new AppError(400, `Entite invalide: ${entity}`);
  }
}

type Tx = Prisma.TransactionClient;

async function deleteNoteRows(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  const deliberations = await tx.deliberation.findMany({
    where: { note_id: { in: ids } },
    select: { id: true },
  });
  if (deliberations.length) {
    const deliberationIds = deliberations.map((d) => d.id);
    await tx.decisionJury.deleteMany({ where: { deliberation_id: { in: deliberationIds } } });
    await tx.mention.deleteMany({ where: { deliberation_id: { in: deliberationIds } } });
    await tx.deliberation.deleteMany({ where: { id: { in: deliberationIds } } });
  }
  await tx.noteHistory.deleteMany({ where: { note_id: { in: ids } } });
  await tx.note.deleteMany({ where: { id_note: { in: ids } } });
}

async function deleteEtudiantRows(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  await tx.notification.deleteMany({ where: { etudiant_id: { in: ids } } });
  const notes = await tx.note.findMany({
    where: { id_etudiant: { in: ids } },
    select: { id_note: true },
  });
  await deleteNoteRows(tx, notes.map((n) => n.id_note));
  const deliberations = await tx.deliberation.findMany({
    where: { etudiant_id: { in: ids } },
    select: { id: true },
  });
  if (deliberations.length) {
    const deliberationIds = deliberations.map((d) => d.id);
    await tx.decisionJury.deleteMany({ where: { deliberation_id: { in: deliberationIds } } });
    await tx.mention.deleteMany({ where: { deliberation_id: { in: deliberationIds } } });
    await tx.deliberation.deleteMany({ where: { id: { in: deliberationIds } } });
  }
  await tx.etudiant.deleteMany({ where: { id_etudiant: { in: ids } } });
}

async function deleteModuleRows(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  const matieres = await tx.matiere.findMany({
    where: { module_id: { in: ids } },
    select: { id: true },
  });
  const matiereIds = matieres.map((m) => m.id);
  if (matiereIds.length) {
    await tx.enseignantMatiere.deleteMany({ where: { matiere_id: { in: matiereIds } } });
    await tx.matiere.deleteMany({ where: { id: { in: matiereIds } } });
  }
  const notes = await tx.note.findMany({
    where: { id_module: { in: ids } },
    select: { id_note: true },
  });
  await deleteNoteRows(tx, notes.map((n) => n.id_note));
  await tx.module.deleteMany({ where: { id_module: { in: ids } } });
}

async function deleteEnseignantRows(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  await tx.notification.deleteMany({ where: { enseignant_id: { in: ids } } });
  await tx.enseignantMatiere.deleteMany({ where: { enseignant_id: { in: ids } } });
  await tx.parcours.updateMany({
    where: { responsable_id: { in: ids } },
    data: { responsable_id: null },
  });
  await tx.enseignant.deleteMany({ where: { id_enseignant: { in: ids } } });
}

function isForeignKeyViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2003"
  );
}

async function runHardDelete(block: (tx: Tx) => Promise<void>) {
  try {
    await prisma.$transaction(block);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new AppError(
        409,
        "Suppression impossible : des enregistrements lies existent encore (desactiver les dependances d'abord)"
      );
    }
    throw error;
  }
}

export async function listTrashHandler(_request: FastifyRequest, reply: FastifyReply) {
  const [students, teachers, modules, grades] = await Promise.all([
    prisma.etudiant.findMany({ where: { statut: "Supprime" } }),
    prisma.enseignant.findMany({ where: { statut: "Supprime" } }),
    prisma.module.findMany({ where: { statut: "Supprime" } }),
    prisma.note.findMany({ where: { statut: "Supprimee" } }),
  ]);
  return reply.send({ students, teachers, modules, grades });
}

export async function restoreTrashHandler(
  request: FastifyRequest<{ Body: { entity: string; id: string } }>,
  reply: FastifyReply
) {
  const { entity, id } = request.body;
  assertTrashEntity(entity);
  let count = 0;
  if (entity === "etudiants")
    count = (
      await prisma.etudiant.updateMany({ where: { id_etudiant: id, statut: "Supprime" }, data: { statut: "Actif" } })
    ).count;
  else if (entity === "enseignants")
    count = (
      await prisma.enseignant.updateMany({ where: { id_enseignant: id, statut: "Supprime" }, data: { statut: "Actif" } })
    ).count;
  else if (entity === "modules")
    count = (
      await prisma.module.updateMany({ where: { id_module: id, statut: "Supprime" }, data: { statut: "Actif" } })
    ).count;
  else if (entity === "notes")
    count = (
      await prisma.note.updateMany({ where: { id_note: id, statut: "Supprimee" }, data: { statut: "Valide" } })
    ).count;

  if (count === 0) throw new AppError(404, "Element introuvable dans la corbeille");
  return reply.send({ restored: true });
}

export async function deleteTrashItemHandler(
  request: FastifyRequest<{ Params: { entity: string; id: string } }>,
  reply: FastifyReply
) {
  const { entity, id } = request.params;
  assertTrashEntity(entity);
  await runHardDelete(async (tx) => {
    if (entity === "notes") {
      const rows = await tx.note.findMany({ where: { id_note: id }, select: { id_note: true } });
      if (!rows.length) throw new AppError(404, "Note introuvable dans la corbeille");
      await deleteNoteRows(tx, [id]);
    } else if (entity === "etudiants") {
      await deleteEtudiantRows(tx, [id]);
    } else if (entity === "modules") {
      await deleteModuleRows(tx, [id]);
    } else if (entity === "enseignants") {
      await deleteEnseignantRows(tx, [id]);
    }
  });
  return reply.status(204).send();
}

export async function emptyTrashHandler(_request: FastifyRequest, reply: FastifyReply) {
  await runHardDelete(async (tx) => {
    const noteIds = await tx.note.findMany({ where: { statut: "Supprimee" }, select: { id_note: true } });
    const moduleIds = await tx.module.findMany({ where: { statut: "Supprime" }, select: { id_module: true } });
    const etudiantIds = await tx.etudiant.findMany({ where: { statut: "Supprime" }, select: { id_etudiant: true } });
    const enseignantIds = await tx.enseignant.findMany({ where: { statut: "Supprime" }, select: { id_enseignant: true } });

    await deleteEtudiantRows(tx, etudiantIds.map((r) => r.id_etudiant));
    await deleteModuleRows(tx, moduleIds.map((r) => r.id_module));
    await deleteNoteRows(tx, noteIds.map((r) => r.id_note));
    await deleteEnseignantRows(tx, enseignantIds.map((r) => r.id_enseignant));
  });
  return reply.send({ emptied: true });
}