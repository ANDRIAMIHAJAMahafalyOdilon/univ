import { z } from "zod";

export const institutionCreateSchema = z
  .object({
    nom: z.string().min(1),
    sigle: z.string().min(1),
    adresse: z.string().optional().nullable(),
    ville: z.string().optional().nullable(),
    pays: z.string().optional().nullable(),
    email_contact: z.string().optional().nullable(),
    site_web: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    statut: z.enum(["Active", "En_Projet", "Archivee"]).default("Active"),
  })
  .superRefine((data, ctx) => {
    const e = data.email_contact?.trim();
    if (e) {
      const ok = z.string().email().safeParse(e);
      if (!ok.success) {
        ctx.addIssue({ code: "custom", path: ["email_contact"], message: "Email invalide" });
      }
    }
  });

export const institutionUpdateSchema = z
  .object({
    nom: z.string().min(1).optional(),
    sigle: z.string().min(1).optional(),
    adresse: z.string().optional().nullable(),
    ville: z.string().optional().nullable(),
    pays: z.string().optional().nullable(),
    email_contact: z.string().optional().nullable(),
    site_web: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    statut: z.enum(["Active", "En_Projet", "Archivee"]).optional(),
  })
  .superRefine((data, ctx) => {
    const e = data.email_contact?.trim();
    if (e) {
      const ok = z.string().email().safeParse(e);
      if (!ok.success) {
        ctx.addIssue({ code: "custom", path: ["email_contact"], message: "Email invalide" });
      }
    }
  });
