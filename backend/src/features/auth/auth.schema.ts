import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const selfRegisterRoles = ["enseignant", "etudiant", "gestionnaire_notes"] as const;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  role: z.enum(selfRegisterRoles).default("etudiant"),
});