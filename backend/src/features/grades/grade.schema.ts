import { z } from "zod";

export const gradeSchema = z.object({
  id_etudiant: z.string().min(1),
  id_module: z.string().min(1),
  note_obtenue: z.number().min(0).max(20),
  type_evaluation: z.enum(["Examen", "TP", "Projet", "Rattrapage", "Controle Continu"]),
  date_saisie: z.string().min(1),
});
