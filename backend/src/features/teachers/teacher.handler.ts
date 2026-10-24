import { FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../core/errors/AppError";
import { teacherSchema, teacherUpdateSchema } from "./teacher.schema";
import { teacherRepository } from "./teacher.repository";

export async function listTeachersHandler(_request: FastifyRequest, reply: FastifyReply) {
  const rows = await teacherRepository.list();
  return reply.send(
    rows.map((t) => {
      const { _count, ...rest } = t;
      return {
        ...rest,
        modules_count: _count?.modules ?? 0,
        matieres_count: _count?.matieres ?? 0,
      };
    })
  );
}

export async function getTeacherHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const row = await teacherRepository.findById(request.params.id);
  if (!row) return reply.status(404).send({ message: "Enseignant introuvable" });
  return reply.send(row);
}

export async function createTeacherHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = teacherSchema.parse(request.body);
  const email =
    body.email_enseignant === undefined || body.email_enseignant === "" || body.email_enseignant === null
      ? null
      : body.email_enseignant;
  return reply.status(201).send(await teacherRepository.create({ ...body, email_enseignant: email }));
}

export async function updateTeacherHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const parsed = teacherUpdateSchema.parse(request.body);
  const data = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined)) as Prisma.EnseignantUpdateInput;
  if (parsed.email_enseignant === "") {
    data.email_enseignant = null;
  }
  try {
    return reply.send(await teacherRepository.update(request.params.id, data));
  } catch {
    throw new AppError(404, "Enseignant introuvable");
  }
}

export async function deleteTeacherHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await teacherRepository.softDelete(request.params.id);
  } catch {
    throw new AppError(404, "Enseignant introuvable");
  }
  return reply.status(204).send();
}
