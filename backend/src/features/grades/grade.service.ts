import { AppError } from "../../core/errors/AppError";
import { fromTypeEvaluation, toTypeEvaluation } from "../../lib/utils/helpers";
import { gradeRepository } from "./grade.repository";

export const gradeService = {
  async list(studentId?: string) {
    const grades = await gradeRepository.list(
      studentId ? { id_etudiant: studentId } : undefined
    );
    return grades.map((g) => ({
      ...g,
      type_evaluation: fromTypeEvaluation(g.type_evaluation),
      nom_etudiant: g.etudiant.nom_etudiant,
      prenom_etudiant: g.etudiant.prenom_etudiant,
      nom_module: g.module.nom_module,
      code_module: g.module.code_module,
      semestre: g.module.semestre,
      annee_academique: g.module.annee_academique,
    }));
  },
  create(payload: {
    id_etudiant: string;
    id_module: string;
    note_obtenue: number;
    type_evaluation: string;
    date_saisie: string;
  }) {
    return gradeRepository.create({
      ...payload,
      type_evaluation: toTypeEvaluation(payload.type_evaluation),
    });
  },
  async remove(id: string) {
    try {
      return await gradeRepository.softDelete(id);
    } catch {
      throw new AppError(404, "Note introuvable");
    }
  },
};
