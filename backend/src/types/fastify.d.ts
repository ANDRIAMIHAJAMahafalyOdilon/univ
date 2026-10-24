import "fastify";
import "@fastify/jwt";
import { FastifyRequest } from "fastify";
import { PrismaClient } from "../generated/prisma/client";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; email: string; role: string };
    user: { id: string; email: string; role: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}