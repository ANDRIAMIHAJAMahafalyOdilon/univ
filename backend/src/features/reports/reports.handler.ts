import { FastifyReply, FastifyRequest } from "fastify";
import PDFDocument from "pdfkit";
import { prisma } from "../../database/prisma";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

export async function studentStatsHandler(
  request: FastifyRequest<{ Params: { studentId: string } }>,
  reply: FastifyReply
) {
  const notes = await prisma.note.findMany({
    where: { id_etudiant: request.params.studentId, statut: "Valide" },
  });
  const moyenne = notes.length ? notes.reduce((acc, n) => acc + n.note_obtenue, 0) / notes.length : null;
  return reply.send([{ moyenne_ponderee: moyenne === null ? null : Number(moyenne.toFixed(2)) }]);
}

export async function moduleAverageHandler(
  request: FastifyRequest<{ Params: { moduleId: string } }>,
  reply: FastifyReply
) {
  const notes = await prisma.note.findMany({
    where: { id_module: request.params.moduleId, statut: "Valide" },
    include: { module: true },
  });
  if (!notes.length) return reply.send({});
  return reply.send({
    id_module: request.params.moduleId,
    nom_module: notes[0].module.nom_module,
    code_module: notes[0].module.code_module,
    moyenne_module: Number(average(notes.map((n) => n.note_obtenue)).toFixed(2)),
  });
}

export async function rankingsHandler(
  request: FastifyRequest<{
    Querystring: { filiere?: string; semester?: string; moduleId?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  const parsedLimit = Number(request.query.limit || 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.trunc(parsedLimit) : 10;
  const notes = await prisma.note.findMany({
    where: { statut: "Valide" },
    include: { etudiant: true, module: true },
  });
  const filtered = notes.filter((n) => {
    if (request.query.filiere && n.etudiant.filiere !== request.query.filiere) return false;
    if (request.query.semester && n.module.semestre !== request.query.semester) return false;
    if (request.query.moduleId && n.id_module !== request.query.moduleId) return false;
    return true;
  });
  const map = new Map<string, { id_etudiant: string; nom_etudiant: string; prenom_etudiant: string; filiere: string; values: number[] }>();
  filtered.forEach((n) => {
    if (!map.has(n.id_etudiant)) {
      map.set(n.id_etudiant, {
        id_etudiant: n.id_etudiant,
        nom_etudiant: n.etudiant.nom_etudiant,
        prenom_etudiant: n.etudiant.prenom_etudiant,
        filiere: n.etudiant.filiere,
        values: [],
      });
    }
    map.get(n.id_etudiant)?.values.push(n.note_obtenue);
  });
  const result = Array.from(map.values())
    .map((row) => ({
      id_etudiant: row.id_etudiant,
      nom_etudiant: row.nom_etudiant,
      prenom_etudiant: row.prenom_etudiant,
      filiere: row.filiere,
      moyenne: Number(average(row.values).toFixed(2)),
    }))
    .sort((a, b) => b.moyenne - a.moyenne)
    .slice(0, limit);
  return reply.send(result);
}

export async function outcomesHandler(
  request: FastifyRequest<{ Querystring: { threshold?: string; semester?: string; academicYear?: string } }>,
  reply: FastifyReply
) {
  const threshold = Number(request.query.threshold || 10);
  const notes = await prisma.note.findMany({
    where: { statut: "Valide" },
    include: { etudiant: true, module: true },
  });
  const filtered = notes.filter((n) => {
    if (request.query.semester && n.module.semestre !== request.query.semester) return false;
    if (request.query.academicYear && n.module.annee_academique !== request.query.academicYear) return false;
    return true;
  });
  const map = new Map<string, { id_etudiant: string; nom_etudiant: string; prenom_etudiant: string; values: number[] }>();
  filtered.forEach((n) => {
    if (!map.has(n.id_etudiant)) {
      map.set(n.id_etudiant, {
        id_etudiant: n.id_etudiant,
        nom_etudiant: n.etudiant.nom_etudiant,
        prenom_etudiant: n.etudiant.prenom_etudiant,
        values: [],
      });
    }
    map.get(n.id_etudiant)?.values.push(n.note_obtenue);
  });
  const rows = Array.from(map.values()).map((row) => ({
    id_etudiant: row.id_etudiant,
    nom_etudiant: row.nom_etudiant,
    prenom_etudiant: row.prenom_etudiant,
    moyenne: Number(average(row.values).toFixed(2)),
  }));
  return reply.send({
    validated: rows.filter((r) => r.moyenne >= threshold),
    failed_or_retake: rows.filter((r) => r.moyenne < threshold),
  });
}

export async function studentReportPdfHandler(
  request: FastifyRequest<{ Params: { studentId: string } }>,
  reply: FastifyReply
) {
  const student = await prisma.etudiant.findUnique({ where: { id_etudiant: request.params.studentId } });
  if (!student) return reply.status(404).send({ error: "Etudiant introuvable" });
  const notes = await prisma.note.findMany({
    where: { id_etudiant: request.params.studentId, statut: "Valide" },
    include: { module: true },
    orderBy: { date_saisie: "asc" },
  });

  reply.hijack();
  reply.raw.writeHead(200, { "Content-Type": "application/pdf" });
  const doc = new PDFDocument({ margin: 40 });
  doc.on("error", () => {
    if (!reply.raw.destroyed) reply.raw.destroy();
  });
  doc.pipe(reply.raw);
  doc.fontSize(16).text("RELEVE DE NOTES", { align: "center" });
  doc.moveDown();
  doc.text(`${student.nom_etudiant} ${student.prenom_etudiant} - ${student.numero_matricule}`);
  notes.forEach((n) => doc.text(`${n.module.code_module} - ${n.note_obtenue}/20 (${n.date_saisie})`));
  doc.end();
}

export async function moduleReportPdfHandler(
  request: FastifyRequest<{ Params: { moduleId: string } }>,
  reply: FastifyReply
) {
  const moduleRow = await prisma.module.findUnique({ where: { id_module: request.params.moduleId } });
  if (!moduleRow) return reply.status(404).send({ error: "Module introuvable" });
  const notes = await prisma.note.findMany({
    where: { id_module: request.params.moduleId, statut: "Valide" },
    include: { etudiant: true },
  });

  reply.hijack();
  reply.raw.writeHead(200, { "Content-Type": "application/pdf" });
  const doc = new PDFDocument({ margin: 40 });
  doc.on("error", () => {
    if (!reply.raw.destroyed) reply.raw.destroy();
  });
  doc.pipe(reply.raw);
  doc.fontSize(16).text(`LISTE DES NOTES - ${moduleRow.nom_module}`, { align: "center" });
  doc.moveDown();
  notes.forEach((n) => doc.text(`${n.etudiant.numero_matricule} - ${n.note_obtenue}/20 (${n.date_saisie})`));
  doc.end();
}
