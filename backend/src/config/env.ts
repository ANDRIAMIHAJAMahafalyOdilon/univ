import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
