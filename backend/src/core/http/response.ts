import { FastifyReply } from "fastify";

export function ok(reply: FastifyReply, data: unknown, statusCode = 200) {
  return reply.status(statusCode).send(data);
}
