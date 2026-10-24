import { z } from "zod";

export const studentSchema = z.object({
  numero_matricule: z.string().min(1),
  nom_etudiant: z.string().min(1),
  prenom_etudiant: z.string().min(1),
  date_naissance: z.string().optional().nullable(),
  filiere: z.string().min(1),
  annee_academique: z.string().min(1),
  contact_etudiant: z.string().optional().nullable(),
  email_etudiant: z.string().email().optional().nullable(),
  parcours_id: z.string().optional().nullable(),
  niveau_id: z.string().optional().nullable(),
  statut: z
    .enum(["Actif", "Suspendu", "Redoublant", "Diplome", "Abandon", "Exclu", "Transfere", "Supprime"])
    .optional()
    .default("Actif"),
});
