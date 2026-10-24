import { FastifyInstance } from "fastify";
import {
  createModuleHandler,
  deleteModuleHandler,
  listModulesHandler,
  updateModuleHandler,
} from "./module.handler";

export async function moduleRoutes(app: FastifyInstance) {
  app.get("/modules", listModulesHandler);
  app.post("/modules", createModuleHandler);
  app.put("/modules/:id", updateModuleHandler);
  app.delete("/modules/:id", deleteModuleHandler);
}
