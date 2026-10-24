import { TypeEvaluation } from "../../generated/prisma/enums";

export function toTypeEvaluation(input: string): TypeEvaluation {
  return (input === "Controle Continu" ? "Controle_Continu" : input) as TypeEvaluation;
}

export function fromTypeEvaluation(input: TypeEvaluation): string {
  return input === "Controle_Continu" ? "Controle Continu" : input;
}

export function clampLimit(raw: string | undefined, defaultValue: number, max: number) {
  const n = Number(raw ?? defaultValue);
  if (!Number.isFinite(n) || n <= 0) return defaultValue;
  return Math.min(Math.trunc(n), max);
}
