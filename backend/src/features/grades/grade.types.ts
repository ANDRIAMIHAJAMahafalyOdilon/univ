export type GradePayload = {
  id_etudiant: string;
  id_module: string;
  note_obtenue: number;
  type_evaluation: "Examen" | "TP" | "Projet" | "Rattrapage" | "Controle Continu";
  date_saisie: string;
};
