import { FastifyInstance } from "fastify";
import {
  moduleAverageHandler,
  outcomesHandler,
  rankingsHandler,
  moduleReportPdfHandler,
  studentReportPdfHandler,
  studentStatsHandler,
} from "./reports.handler";
import {
  searchModulesHandler,
  searchStudentsHandler,
  searchTeachersHandler,
} from "./search.handler";
import { schemaOverviewHandler } from "./schema.handler";

export async function reportRoutes(app: FastifyInstance) {
  app.get("/stats/student/:studentId", studentStatsHandler);
  app.get("/stats/module/:moduleId/average", moduleAverageHandler);
  app.get("/stats/rankings", rankingsHandler);
  app.get("/stats/outcomes", outcomesHandler);
  app.get("/search/students", searchStudentsHandler);
  app.get("/search/modules", searchModulesHandler);
  app.get("/search/teachers", searchTeachersHandler);
  app.get("/system/schema", schemaOverviewHandler);
  app.get("/reports/student/:studentId/pdf", studentReportPdfHandler);
  app.get("/reports/module/:moduleId/pdf", moduleReportPdfHandler);
}
