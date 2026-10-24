import { z } from "zod";

export const sessionSchema = z.object({
  nom: z.string().min(1),
  type_session: z.enum(["Normale", "Rattrapage", "Speciale"]),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  annee_universitaire_id: z.string().min(1),
});

