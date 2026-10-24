import { FastifyReply, FastifyRequest } from "fastify";
import { ROLE_PERMISSIONS, userService } from "./user.service";

export async function listUsersHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await userService.list());
}

export async function getUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  return reply.send(await userService.getById(request.params.id));
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const created = await userService.create(request.body);
  return reply.status(201).send(created);
}

export async function updateUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  return reply.send(await userService.update(request.params.id, request.body));
}

export async function deleteUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await userService.remove(request.params.id);
  return reply.status(204).send();
}

export async function resetPasswordHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  return reply.send(await userService.resetPassword(request.params.id, request.body));
}

export async function rolePermissionsHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(ROLE_PERMISSIONS);
}
