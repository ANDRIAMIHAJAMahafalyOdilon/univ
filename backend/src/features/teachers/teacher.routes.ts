import { FastifyInstance } from "fastify";
import {
  createTeacherHandler,
  deleteTeacherHandler,
  getTeacherHandler,
  listTeachersHandler,
  updateTeacherHandler,
} from "./teacher.handler";

export async function teacherRoutes(app: FastifyInstance) {
  app.get("/teachers", listTeachersHandler);
  app.get("/teachers/:id", getTeacherHandler);
  app.post("/teachers", createTeacherHandler);
  app.put("/teachers/:id", updateTeacherHandler);
  app.delete("/teachers/:id", deleteTeacherHandler);
}
