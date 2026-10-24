import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../core/errors/AppError";
import type { Prisma } from "../../generated/prisma/client";
import { institutionCreateSchema, institutionUpdateSchema } from "./institution.schema";

const DEFAULT_ID = "default";

async function ensureInstitution() {
  const row = await prisma.institution.findUnique({ where: { id: DEFAULT_ID } });
  if (row) return row;
  return prisma.institution.create({
    data: {
      id: DEFAULT_ID,
      nom: "Université UniNotes",
      sigle: "UNINOTES",
      adresse: null,
      ville: null,
      pays: null,
      email_contact: "contact@univ.local",
      site_web: null,
      description: "Établissement configuré pour UniNotes.",
      statut: "Active",
    },
  });
}

async function institutionCounts(id: string) {
  const isDefault = id === DEFAULT_ID;
  const [totalParcours, totalEtudiants, totalEnseignants, totalModules] = await Promise.all([
    prisma.parcours.count({
      where: {
        statut: "Actif",
        ...(isDefault ? {} : { institution_id: id }),
      },
    }),
    isDefault ? prisma.etudiant.count({ where: { statut: { not: "Supprime" } } }) : 0,
    isDefault ? prisma.enseignant.count({ where: { statut: "Actif" } }) : 0,
    isDefault ? prisma.module.count({ where: { statut: "Actif" } }) : 0,
  ]);
  return { totalParcours, totalEtudiants, totalEnseignants, totalModules };
}

async function buildUpdate(body: z.infer<typeof institutionUpdateSchema>): Promise<Prisma.InstitutionUpdateInput> {
  const data: Prisma.InstitutionUpdateInput = {};
  if (body.email_contact !== undefined) {
    const rawEmail = body.email_contact?.trim() ?? null;
    data.email_contact = !rawEmail ? null : rawEmail;
  }
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.sigle !== undefined) data.sigle = body.sigle;
  if (body.adresse !== undefined) data.adresse = body.adresse;
  if (body.ville !== undefined) data.ville = body.ville;
  if (body.pays !== undefined) data.pays = body.pays;
  if (body.site_web !== undefined) data.site_web = body.site_web;
  if (body.description !== undefined) data.description = body.description;
  if (body.statut !== undefined) data.statut = body.statut;
  return data;
}

async function updateById(id: string, body: z.infer<typeof institutionUpdateSchema>) {
  const data = await buildUpdate(body);
  return prisma.institution.update({ where: { id }, data }).catch(() => {
    throw new AppError(404, "Université introuvable");
  });
}

export async function institutionRoutes(app: FastifyInstance) {
  app.get("/institution", async (_request: FastifyRequest, reply: FastifyReply) => {
    const institution = await ensureInstitution();
    const counts = await institutionCounts(institution.id);
    return reply.send({ institution, counts });
  });

  app.get("/institutions", async (_request: FastifyRequest, reply: FastifyReply) => {
    let institutions = await prisma.institution.findMany({ orderBy: { created_at: "asc" } });
    if (!institutions.length) institutions = [await ensureInstitution()];
    const rows = await Promise.all(
      institutions.map(async (inst) => {
        const counts = await institutionCounts(inst.id);
        return {
          ...inst,
          nb_parcours: counts.totalParcours,
          nb_etudiants: counts.totalEtudiants,
          nb_enseignants: counts.totalEnseignants,
          nb_modules: counts.totalModules,
        };
      })
    );
    return reply.send(rows);
  });

  app.get("/institution/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const institution = await prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      throw new AppError(404, "Université introuvable");
    }
    const counts = await institutionCounts(institution.id);
    return reply.send({ institution, counts });
  });

  app.post("/institutions", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = institutionCreateSchema.parse(request.body);
    const institution = await prisma.institution.create({
      data: {
        id: randomUUID(),
        nom: body.nom,
        sigle: body.sigle,
        adresse: body.adresse ?? null,
        ville: body.ville ?? null,
        pays: body.pays ?? null,
        email_contact: body.email_contact?.trim() ? body.email_contact.trim() : null,
        site_web: body.site_web ?? null,
        description: body.description ?? null,
        statut: body.statut,
      },
    });
    return reply.status(201).send(institution);
  });

  app.put("/institution", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = institutionUpdateSchema.parse(request.body);
    await ensureInstitution();
    const updated = await updateById(DEFAULT_ID, body);
    return reply.send(updated);
  });

  app.put("/institution/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = institutionUpdateSchema.parse(request.body);
    const updated = await updateById(id, body);
    return reply.send(updated);
  });
}