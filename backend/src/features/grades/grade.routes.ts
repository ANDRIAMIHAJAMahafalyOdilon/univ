import { FastifyInstance } from "fastify";
import { createGradeHandler, deleteGradeHandler, listGradesHandler } from "./grade.handler";

export async function gradeRoutes(app: FastifyInstance) {
  app.get("/grades", listGradesHandler);
  app.post("/grades", createGradeHandler);
  app.delete("/grades/:id", deleteGradeHandler);
}
