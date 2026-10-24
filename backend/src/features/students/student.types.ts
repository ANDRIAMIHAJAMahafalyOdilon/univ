import { z } from "zod";
import { studentSchema } from "./student.schema";

export type StudentPayload = z.infer<typeof studentSchema>;
