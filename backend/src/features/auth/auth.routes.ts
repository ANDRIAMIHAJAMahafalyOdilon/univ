import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loginHandler, registerHandler } from "./auth.handler";
import { userRepository } from "../users/user.repository";

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = await userRepository.findPublicById(request.user.id);
  return reply.send({ user });
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", loginHandler);
  app.post("/auth/register", registerHandler);
  app.get("/auth/me", { preHandler: [app.authenticate] }, meHandler);
}