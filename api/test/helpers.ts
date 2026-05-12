import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server.js";
import { resetDatabase } from "../src/db.js";

let cachedApp: FastifyInstance | null = null;

export async function getApp(): Promise<FastifyInstance> {
  if (cachedApp) return cachedApp;
  cachedApp = await buildServer();
  await cachedApp.ready();
  return cachedApp;
}

export function resetDb(): void {
  resetDatabase();
}

export const JSON_HEADERS = { "content-type": "application/json" } as const;
