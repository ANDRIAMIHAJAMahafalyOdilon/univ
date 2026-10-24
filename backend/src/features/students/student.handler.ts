import { FastifyReply, FastifyRequest } from "fastify";
import { studentSchema } from "./student.schema";
import { studentService } from "./student.service";

export async function listStudentsHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await studentService.list());
}

export async function getStudentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  return reply.send(await studentService.getById(request.params.id));
}

export async function createStudentHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = studentSchema.parse(request.body);
  const created = await studentService.create(body);
  return reply.status(201).send(created);
}

export async function updateStudentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = studentSchema.parse(request.body);
  return reply.send(await studentService.update(request.params.id, body));
}

export async function deleteStudentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await studentService.remove(request.params.id);
  return reply.status(204).send();
}
