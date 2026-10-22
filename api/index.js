import { app } from "../backend/src/app.js";
import { ensureRuntimeEnv } from "../backend/src/config/env.js";

export default function handler(request, response) {
  ensureRuntimeEnv();

  const incomingUrl = request.url || "/";
  if (incomingUrl.startsWith("/api")) {
    request.url = incomingUrl.replace(/^\/api/, "") || "/";
  }

  return app(request, response);
}