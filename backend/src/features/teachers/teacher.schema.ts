import { z } from "zod";

export const teacherSchema = z.object({
  nom_enseignant: z.string().min(1),
  prenom_enseignant: z.string().min(1),
  departement: z.string().min(1),
  contact_enseignant: z.string().optional().nullable(),
  email_enseignant: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
});

export const teacherUpdateSchema = teacherSchema.partial().extend({
  statut: z.enum(["Actif", "Supprime"]).optional(),
});
