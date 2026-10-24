import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    role TEXT NOT NULL,
    statut TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS enseignant (
    id_enseignant TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS etudiant (
    id_etudiant TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS annee_universitaire (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS parcours (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS niveau (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS module (
    id_module TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS matiere (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS enseignant_matiere (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS session_examen (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS note (
    id_note TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS note_history (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS deliberation (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS decision_jury (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS mention (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS notification (
    id TEXT PRIMARY KEY
  )`,
];

async function main() {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log(rows.map((r) => r.name).join("\n"));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
