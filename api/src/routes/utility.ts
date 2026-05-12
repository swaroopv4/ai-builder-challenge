import type { FastifyInstance } from "fastify";
import { resetDatabase } from "../db.js";

export async function utilityRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/reset", async (_req, reply) => {
    resetDatabase();
    return reply.send({ ok: true, reseeded_at: new Date().toISOString() });
  });
}

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_req, reply) => {
    return reply.send({ ok: true, version: "1.0.0" });
  });
}
