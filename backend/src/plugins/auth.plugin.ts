import fp from "fastify-plugin";
import { FastifyRequest } from "fastify";
import { AppError } from "../core/errors/AppError";

export default fp(async (fastify) => {
  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, "Non autorisé");
    }
  });
});