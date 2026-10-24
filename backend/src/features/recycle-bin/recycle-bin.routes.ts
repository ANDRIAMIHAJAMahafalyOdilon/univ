import { FastifyInstance } from "fastify";
import {
  deleteTrashItemHandler,
  emptyTrashHandler,
  listTrashHandler,
  restoreTrashHandler,
} from "./recycle-bin.handler";

export async function recycleBinRoutes(app: FastifyInstance) {
  app.get("/trash", listTrashHandler);
  app.post("/trash/restore", restoreTrashHandler);
  app.delete("/trash/:entity/:id", deleteTrashItemHandler);
  app.delete("/trash", emptyTrashHandler);
}
