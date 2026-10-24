import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../database/prisma";

export async function searchStudentsHandler(
  request: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
) {
  const q = (request.query.q || "").toLowerCase();
  const rows = await prisma.etudiant.findMany({ where: { statut: "Actif" } });
  return reply.send(
    rows.filter(
      (s) =>
        s.nom_etudiant.toLowerCase().includes(q) ||
        s.prenom_etudiant.toLowerCase().includes(q) ||
        s.numero_matricule.toLowerCase().includes(q)
    )
  );
}

export async function searchModulesHandler(
  request: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
) {
  const q = (request.query.q || "").toLowerCase();
  const rows = await prisma.module.findMany({ where: { statut: "Actif" } });
  return reply.send(
    rows.filter(
      (m) => m.nom_module.toLowerCase().includes(q) || m.code_module.toLowerCase().includes(q)
    )
  );
}

export async function searchTeachersHandler(
  request: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
) {
  const q = (request.query.q || "").toLowerCase();
  const rows = await prisma.enseignant.findMany({ where: { statut: "Actif" } });
  return reply.send(
    rows.filter(
      (t) => t.nom_enseignant.toLowerCase().includes(q) || t.departement.toLowerCase().includes(q)
    )
  );
}
