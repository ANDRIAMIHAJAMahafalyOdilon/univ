import { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema, registerSchema } from "./auth.schema";
import { loginService, registerService } from "./auth.service";

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = loginSchema.parse(request.body);
  const result = await loginService(request.server, body.email, body.password);
  return reply.send(result);
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = registerSchema.parse(request.body);
  const result = await registerService(request.server, body);
  return reply.send(result);
}
