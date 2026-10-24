import { FastifyReply, FastifyRequest } from "fastify";
import { gradeSchema } from "./grade.schema";
import { gradeService } from "./grade.service";

export async function listGradesHandler(
  request: FastifyRequest<{ Querystring: { studentId?: string } }>,
  reply: FastifyReply
) {
  return reply.send(await gradeService.list(request.query.studentId));
}

export async function createGradeHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = gradeSchema.parse(request.body);
  const created = await gradeService.create(body);
  return reply.status(201).send(created);
}

export async function deleteGradeHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await gradeService.remove(request.params.id);
  return reply.status(204).send();
}
