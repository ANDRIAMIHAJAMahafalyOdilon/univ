import { FastifyInstance } from "fastify";

export async function signJwt(app: FastifyInstance, payload: { id: string; email: string; role: string }) {
  return app.jwt.sign(payload);
}
