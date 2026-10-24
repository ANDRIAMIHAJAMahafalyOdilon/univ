import { FastifyInstance } from "fastify";
import {
  createStudentHandler,
  deleteStudentHandler,
  getStudentHandler,
  listStudentsHandler,
  updateStudentHandler,
} from "./student.handler";

export async function studentRoutes(app: FastifyInstance) {
  app.get("/students", listStudentsHandler);
  app.get("/students/:id", getStudentHandler);
  app.post("/students", createStudentHandler);
  app.put("/students/:id", updateStudentHandler);
  app.delete("/students/:id", deleteStudentHandler);
}
