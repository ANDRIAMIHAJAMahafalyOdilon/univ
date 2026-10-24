import { AppError } from "../../core/errors/AppError";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "./user.schema";
import { userRepository } from "./user.repository";

export const userService = {
  list: () => userRepository.list(),
  async getById(id: string) {
    const row = await userRepository.findPublicById(id);
    if (!row) throw new AppError(404, "Utilisateur introuvable");
    return row;
  },
  create(raw: unknown) {
    const body = createUserSchema.parse(raw);
    return userRepository.create(body);
  },
  async update(id: string, raw: unknown) {
    const body = updateUserSchema.parse(raw);
    try {
      return await userRepository.update(id, body);
    } catch {
      throw new AppError(404, "Utilisateur introuvable");
    }
  },
  async remove(id: string) {
    try {
      return await userRepository.softDelete(id);
    } catch {
      throw new AppError(404, "Utilisateur introuvable");
    }
  },
  async resetPassword(id: string, raw: unknown) {
    const body = resetPasswordSchema.parse(raw);
    try {
      return await userRepository.update(id, { password: body.password });
    } catch {
      throw new AppError(404, "Utilisateur introuvable");
    }
  },
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["full_access"],
  admin: ["students", "teachers", "modules", "grades", "reports", "cursus", "trash"],
  it_support: ["users_read", "users_reset_password", "audit"],
  gestionnaire_notes: ["grades", "modules_read", "students_read"],
  enseignant: ["grades_own", "modules_own"],
  etudiant: ["self_profile", "self_grades"],
};
