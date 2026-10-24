import { z } from "zod";

export const userRoles = [
  "super_admin",
  "admin",
  "it_support",
  "gestionnaire_notes",
  "enseignant",
  "etudiant",
] as const;

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  role: z.enum(userRoles),
  statut: z.enum(["Actif", "Supprime"]).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  role: z.enum(userRoles).optional(),
  statut: z.enum(["Actif", "Supprime"]).optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6),
});
