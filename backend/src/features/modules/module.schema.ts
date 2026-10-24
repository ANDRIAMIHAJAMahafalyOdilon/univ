import { z } from "zod";

export const moduleSchema = z.object({
  code_module: z.string().min(1),
  nom_module: z.string().min(1),
  credits_ects: z.number().int().nonnegative(),
  coefficient_module: z.number().int().positive(),
  semestre: z.string().min(1),
  annee_academique: z.string().min(1),
id_enseignant_responsable: z.string().min(1),
  niveau_libelle: z.string().min(1).optional().nullable(),
  annee_universitaire_id: z.string().min(1).optional().nullable(),
  niveau_id: z.string().min(1).optional().nullable(),
  parcours_id: z.string().min(1).optional().nullable(),
});
