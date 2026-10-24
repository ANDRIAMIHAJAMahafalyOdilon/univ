import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../database/prisma";

export async function schemaOverviewHandler(_request: FastifyRequest, reply: FastifyReply) {
  const groups = {
    etablissements: ["institution"],
    utilisateurs: ["users", "enseignant", "etudiant"],
    cursus: [
      "annee_universitaire",
      "parcours",
      "niveau",
      "module",
      "matiere",
      "enseignant_matiere",
    ],
    notes: ["session_examen", "note", "note_history"],
    resultats: ["deliberation", "decision_jury", "mention"],
    suivi_systeme: ["audit_log", "notification"],
  };

  const dropdownOptions = {
    users: {
      role: ["super_admin", "admin", "it_support", "gestionnaire_notes", "enseignant", "etudiant"],
      statut: ["Actif", "Supprime"],
    },
    enseignant: { statut: ["Actif", "Supprime"] },
    etudiant: { statut: ["Actif", "Suspendu", "Redoublant", "Diplome", "Abandon", "Exclu", "Transfere", "Supprime"] },
    annee_universitaire: { statut: ["Actif", "Supprime"] },
    parcours: {
      statut: ["Actif", "Supprime"],
      etat_metier: ["Actif", "En_Developpement", "Archive", "Obsolete"],
    },
    niveau: { statut: ["Actif", "Supprime"] },
    module: { statut: ["Actif", "Supprime"] },
    matiere: { statut: ["Actif", "Supprime"] },
    session_examen: {
      type_session: ["Normale", "Rattrapage", "Speciale"],
      statut: ["Actif", "Supprime"],
    },
    note: {
      type_evaluation: ["Examen", "TP", "Projet", "Rattrapage", "Controle_Continu"],
      statut: ["Valide", "Supprimee"],
    },
    deliberation: { est_valide: ["true", "false"] },
    decision_jury: { decision: ["Admis", "Ajourne", "Redoublement", "Exclusion"] },
    mention: { mention: ["Passable", "Assez_Bien", "Bien", "Tres_Bien", "Excellence"] },
    notification: {
      type: ["Info", "Alerte", "Systeme"],
      lu: ["true", "false"],
    },
  };

  const tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  const existingTables = tables.map((t) => t.name);
  const expectedTables = Object.values(groups).flat();

  const missing_tables = expectedTables.filter((t) => !existingTables.includes(t));
  const extra_tables = existingTables.filter((t) => !expectedTables.includes(t));

  return reply.send({
    groups,
    existing_tables: existingTables,
    expected_tables: expectedTables,
    missing_tables,
    extra_tables,
    dropdown_options: dropdownOptions,
  });
}
