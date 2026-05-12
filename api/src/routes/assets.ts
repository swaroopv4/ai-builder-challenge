import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAsset, getDb, listAssets, listEvents } from "../db.js";
import { sendError } from "../errors.js";

const ListQuerySchema = z.object({
  state: z.string().optional(),
  site: z.string().optional(),
  custodian: z.string().optional(),
});

export async function assetsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/assets", async (req, reply) => {
    const parse = ListQuerySchema.safeParse(req.query);
    if (!parse.success) {
      return sendError(reply, 400, "invalid_query", "Invalid query parameters", {
        issues: parse.error.issues,
      });
    }
    const assets = listAssets(getDb(), parse.data);
    return reply.send(assets);
  });

  app.get<{ Params: { asset_tag: string } }>(
    "/v1/assets/:asset_tag",
    async (req, reply) => {
      const asset = getAsset(getDb(), req.params.asset_tag);
      if (!asset) {
        return sendError(reply, 404, "unknown_asset", `Asset ${req.params.asset_tag} not found`);
      }
      return reply.send(asset);
    },
  );

  app.get<{ Params: { asset_tag: string } }>(
    "/v1/assets/:asset_tag/events",
    async (req, reply) => {
      const asset = getAsset(getDb(), req.params.asset_tag);
      if (!asset) {
        return sendError(reply, 404, "unknown_asset", `Asset ${req.params.asset_tag} not found`);
      }
      const events = listEvents(getDb(), req.params.asset_tag);
      return reply.send(events);
    },
  );
}
