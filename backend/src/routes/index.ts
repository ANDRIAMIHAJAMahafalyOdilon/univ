import { FastifyInstance } from "fastify";
import { authRoutes } from "../features/auth/auth.routes";
import { studentRoutes } from "../features/students/student.routes";
import { teacherRoutes } from "../features/teachers/teacher.routes";
import { moduleRoutes } from "../features/modules/module.routes";
import { gradeRoutes } from "../features/grades/grade.routes";
import { recycleBinRoutes } from "../features/recycle-bin/recycle-bin.routes";
import { reportRoutes } from "../features/reports/reports.routes";
import { cursusRoutes } from "../features/cursus/cursus.routes";
import { userRoutes } from "../features/users/user.routes";
import { sessionExamenRoutes } from "../features/notes/sessions.routes";
import { noteHistoryRoutes } from "../features/notes/history.routes";
import { systemTrackingRoutes } from "../features/system-tracking/system-tracking.routes";
import { institutionRoutes } from "../features/institution/institution.routes";
import { matiereRoutes } from "../features/matieres/matiere.routes";
import { resultsRoutes } from "../features/results/results.routes";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/api/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api" });

  await app.register(
    async (protectedApi) => {
      protectedApi.addHook("onRequest", protectedApi.authenticate);

      await protectedApi.register(userRoutes);
      await protectedApi.register(studentRoutes);
      await protectedApi.register(teacherRoutes);
      await protectedApi.register(moduleRoutes);
      await protectedApi.register(gradeRoutes);
      await protectedApi.register(sessionExamenRoutes);
      await protectedApi.register(noteHistoryRoutes);
      await protectedApi.register(systemTrackingRoutes);
      await protectedApi.register(recycleBinRoutes);
      await protectedApi.register(reportRoutes);
      await protectedApi.register(cursusRoutes);
      await protectedApi.register(institutionRoutes);
      await protectedApi.register(matiereRoutes);
      await protectedApi.register(resultsRoutes);
    },
    { prefix: "/api" }
  );
}
