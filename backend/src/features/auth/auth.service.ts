import { FastifyInstance } from "fastify";
import { AppError } from "../../core/errors/AppError";
import { prisma } from "../../database/prisma";
import { hash, isBcryptHash, legacySha256, verify } from "../../lib/crypto/hash";
import { signJwt } from "../../lib/auth/jwt";
import { authRepository } from "./auth.repository";
import { userRepository } from "../users/user.repository";

export async function loginService(app: FastifyInstance, email: string, password: string) {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw new AppError(401, "Identifiants invalides");
  }

  const passwordOk = isBcryptHash(user.password)
    ? await verify(password, user.password)
    : user.password === legacySha256(password);
  if (!passwordOk) {
    throw new AppError(401, "Identifiants invalides");
  }

  if (!isBcryptHash(user.password)) {
    await authRepository.upgradePassword(user.id, await hash(password));
  }

  await prisma.users.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });
  const token = await signJwt(app, { id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function registerService(
  app: FastifyInstance,
  data: { email: string; password: string; nom: string; prenom: string; role: string }
) {
  const existing = await userRepository.findWithPasswordByEmail(data.email);
  if (existing) {
    throw new AppError(409, "Un compte existe déjà avec cet email");
  }

  const user = await userRepository.create(data);
  const token = await signJwt(app, { id: user.id, email: user.email, role: user.role });
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
  };
}