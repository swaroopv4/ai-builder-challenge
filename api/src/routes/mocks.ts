import type { FastifyInstance } from "fastify";
import { FACILITIES_RECORDS } from "../seed/facilities.js";
import { FINANCE_RECORDS } from "../seed/finance.js";

export async function mocksRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/mock/facilities/spaces", async (_req, reply) => {
    return reply.send(FACILITIES_RECORDS);
  });

  app.get("/v1/mock/finance/equipment", async (_req, reply) => {
    return reply.send(FINANCE_RECORDS);
  });
}
