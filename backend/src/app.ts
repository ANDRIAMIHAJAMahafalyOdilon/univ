import Fastify from "fastify";
import { env } from "./config";
import { errorHandler } from "./core/errors/errorHandler";
import prismaPlugin from "./plugins/prisma.plugin";
import jwtPlugin from "./plugins/jwt.plugin";
import authPlugin from "./plugins/auth.plugin";
import corsPlugin from "./plugins/cors.plugin";
import rateLimitPlugin from "./plugins/rateLimit.plugin";
import swaggerPlugin from "./plugins/swagger.plugin";
import { registerRoutes } from "./routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
      transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
    },
  });
  app.setErrorHandler(errorHandler);

  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await registerRoutes(app);

  return app;
}

export const serverConfig = { port: env.PORT, host: env.HOST };
