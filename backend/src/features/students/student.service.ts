import { AppError } from "../../core/errors/AppError";
import { studentRepository } from "./student.repository";
import { StudentPayload } from "./student.types";

export const studentService = {
  list: () => studentRepository.list(),
  async getById(id: string) {
    const row = await studentRepository.findById(id);
    if (!row) throw new AppError(404, "Etudiant introuvable");
    return row;
  },
  create: (payload: StudentPayload) => studentRepository.create(payload),
  async update(id: string, payload: StudentPayload) {
    try {
      return await studentRepository.update(id, payload);
    } catch {
      throw new AppError(404, "Etudiant introuvable");
    }
  },
  async remove(id: string) {
    const result = await studentRepository.softDelete(id);
    if (result.count === 0) {
      throw new AppError(404, "Etudiant introuvable");
    }
  },
};
