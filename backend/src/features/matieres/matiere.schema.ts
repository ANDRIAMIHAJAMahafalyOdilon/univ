import { z } from "zod";

export const matiereSchema = z.object({
  code: z.string().min(1, "Code obligatoire"),
  nom: z.string().min(1, "Nom obligatoire"),
  coefficient: z.number().positive(),
  module_id: z.string().min(1, "Module obligatoire"),
  semestre: z.string().min(1, "Semestre obligatoire"),
});