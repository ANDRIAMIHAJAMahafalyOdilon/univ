import { FastifyInstance } from "fastify";
import {
  createUserHandler,
  deleteUserHandler,
  getUserHandler,
  listUsersHandler,
  resetPasswordHandler,
  rolePermissionsHandler,
  updateUserHandler,
} from "./user.handler";

export async function userRoutes(app: FastifyInstance) {
  app.get("/users", listUsersHandler);
  app.get("/users/permissions-matrix", rolePermissionsHandler);
  app.get("/users/:id", getUserHandler);
  app.post("/users", createUserHandler);
  app.put("/users/:id", updateUserHandler);
  app.delete("/users/:id", deleteUserHandler);
  app.post("/users/:id/reset-password", resetPasswordHandler);
}
