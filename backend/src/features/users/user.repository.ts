import { prisma } from "../../database/prisma";
import { hash } from "../../lib/crypto/hash";

const publicSelect = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  role: true,
  statut: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} as const;

export const userRepository = {
  list: () =>
    prisma.users.findMany({
      orderBy: { created_at: "desc" },
      select: publicSelect,
    }),

  findPublicById: (id: string) =>
    prisma.users.findUnique({
      where: { id },
      select: publicSelect,
    }),

  findWithPasswordByEmail: (email: string) => prisma.users.findUnique({ where: { email } }),

  create: async (data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    role: string;
    statut?: "Actif" | "Supprime";
  }) =>
    prisma.users.create({
      data: {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role as never,
        ...(data.statut ? { statut: data.statut } : {}),
        password: await hash(data.password),
      },
      select: publicSelect,
    }),

  update: async (
    id: string,
    data: {
      email?: string;
      nom?: string;
      prenom?: string;
      role?: string;
      statut?: "Actif" | "Supprime";
      password?: string;
    }
  ) => {
    const { password, role, ...rest } = data;
    return prisma.users.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { password: await hash(password) } : {}),
        ...(role !== undefined ? { role: role as never } : {}),
      },
      select: publicSelect,
    });
  },

  upgradePassword: (id: string, nextPassword: string) =>
    prisma.users.update({
      where: { id },
      data: { password: nextPassword },
      select: { id: true },
    }),

  softDelete: (id: string) =>
    prisma.users.update({
      where: { id },
      data: { statut: "Supprime" },
      select: publicSelect,
    }),

  touchLogin: (id: string) =>
    prisma.users.update({
      where: { id },
      data: { last_login_at: new Date() },
      select: { id: true },
    }),
};