import type { FastifyReply } from "fastify";
import type { ApiError } from "./domain/types.js";

export async function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Promise<FastifyReply> {
  const body: ApiError = {
    error: details ? { code, message, details } : { code, message },
  };
  return reply.code(status).send(body);
}
