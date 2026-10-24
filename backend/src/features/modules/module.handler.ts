import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../core/errors/AppError";
import { moduleSchema } from "./module.schema";
import { moduleRepository } from "./module.repository";

export async function listModulesHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await moduleRepository.list());
}

export async function createModuleHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = moduleSchema.parse(request.body);
  return reply.status(201).send(await moduleRepository.create(body));
}

export async function updateModuleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = moduleSchema.parse(request.body);
  try {
    return reply.send(await moduleRepository.update(request.params.id, body));
  } catch {
    throw new AppError(404, "Module introuvable");
  }
}

export async function deleteModuleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await moduleRepository.softDelete(request.params.id);
  } catch {
    throw new AppError(404, "Module introuvable");
  }
  return reply.status(204).send();
}
