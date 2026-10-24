import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { env } from "../config";

export default fp(async (fastify) => {
  await fastify.register(fastifyJwt, { secret: env.JWT_SECRET });
});
