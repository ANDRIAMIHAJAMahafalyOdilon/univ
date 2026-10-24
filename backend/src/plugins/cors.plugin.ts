import fp from "fastify-plugin";
import cors from "@fastify/cors";
import { env } from "../config";

const explicitOrigins = env.CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const localOrLanHttp = /^https?:\/\/(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})(:\d+)?$/;

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || explicitOrigins.includes(origin) || localOrLanHttp.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Origine non autorisée par CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
});