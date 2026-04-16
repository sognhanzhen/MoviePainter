import http from "node:http";
import { parse } from "node:url";
import next from "next";
import "./env.js";
import { createApp } from "./app.js";
import { workspaceRoot } from "./env.js";

type NextFactory = (options: { dev: boolean; dir: string; hostname: string; port: number }) => {
  getRequestHandler: () => (req: http.IncomingMessage, res: http.ServerResponse, parsedUrl?: ReturnType<typeof parse>) => Promise<void>;
  prepare: () => Promise<void>;
};

type StartServerOptions = {
  dev: boolean;
};

export async function startMoviePainterServer({ dev }: StartServerOptions) {
  const hostname = "0.0.0.0";
  const port = dev ? 3000 : Number(process.env.PORT ?? 3000);
  const createNextApp = next as unknown as NextFactory;
  const nextApp = createNextApp({
    dev,
    dir: workspaceRoot,
    hostname,
    port
  });

  const handle = nextApp.getRequestHandler();
  const apiApp = createApp();

  await nextApp.prepare();

  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    const pathname = parsedUrl.pathname ?? "/";

    if (pathname.startsWith("/api")) {
      apiApp(req, res);
      return;
    }

    void handle(req, res, parsedUrl).catch((error: unknown) => {
      console.error(error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });

  server.listen(port, hostname, () => {
    console.log(`MoviePainter Next server running at http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}
