import { buildServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";

async function main(): Promise<void> {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info({ msg: "API listening", port: PORT, host: HOST });
  } catch (err) {
    app.log.error({ err: { message: (err as Error).message } });
    process.exit(1);
  }
}

main();
