import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../core/errors/AppError";
import { matiereSchema } from "./matiere.schema";
import { matiereRepository } from "./matiere.repository";

export async function listMatieresHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await matiereRepository.list());
}

export async function createMatiereHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = matiereSchema.parse(request.body);
  return reply.status(201).send(await matiereRepository.create(body));
}

export async function updateMatiereHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = matiereSchema.parse(request.body);
  try {
    return reply.send(await matiereRepository.update(request.params.id, body));
  } catch {
    throw new AppError(404, "Matiere introuvable");
  }
}

export async function deleteMatiereHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await matiereRepository.softDelete(request.params.id);
  } catch {
    throw new AppError(404, "Matiere introuvable");
  }
  return reply.status(204).send();
}