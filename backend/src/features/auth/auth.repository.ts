import { prisma } from "../../database/prisma";

export const authRepository = {
  findByEmail: (email: string) => prisma.users.findUnique({ where: { email } }),
  upgradePassword: (id: string, password: string) =>
    prisma.users.update({ where: { id }, data: { password }, select: { id: true } }),
};