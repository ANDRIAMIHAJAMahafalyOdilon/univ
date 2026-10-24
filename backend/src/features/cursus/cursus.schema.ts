import { z } from "zod";

export const anneeUpsertSchema = z.object({
  libelle: z.string().min(1),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  est_active: z.boolean().optional(),
  statut: z.enum(["Actif", "Supprime"]).optional(),
});

export const parcoursEtatMetierEnum = z.enum(["Actif", "En_Developpement", "Archive", "Obsolete"]);

export const parcoursUpsertSchema = z.object({
  code: z.string().min(1),
  nom: z.string().min(1),
  description: z.string().optional().nullable(),
  etat_metier: parcoursEtatMetierEnum.optional(),
  responsable_id: z.string().uuid().optional().nullable(),
  institution_id: z.string().min(1).optional(),
});

export const niveauUpsertSchema = z.object({
  code: z.string().min(1),
  nom: z.string().min(1),
  parcours_id: z.string().min(1),
  annee_universitaire_id: z.string().min(1),
});
