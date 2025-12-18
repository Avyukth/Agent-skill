import { serve } from "../src/index.js";

const headless = process.env.HEADLESS === "true";

console.log(`Starting server in ${headless ? "headless" : "visible"} mode...`);

const server = await serve({ headless });

console.log(`
Ready!
  HTTP API: http://localhost:${server.port}
  WebSocket: ${server.wsEndpoint}
`);
