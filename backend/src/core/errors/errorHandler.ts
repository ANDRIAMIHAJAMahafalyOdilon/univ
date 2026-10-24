import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./AppError";

export function errorHandler(error: Error, _request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message, details: error.details });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: "Payload invalide",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const message = String(error.message || "");
  if (message.includes("Unique constraint failed")) {
    return reply.status(409).send({ error: "Contrainte de donnees violee", details: message });
  }

  return reply.status(500).send({ error: "Erreur interne", details: message });
}
