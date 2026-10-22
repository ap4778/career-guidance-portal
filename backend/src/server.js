import { app } from "./app.js";
import { ensureRuntimeEnv, env } from "./config/env.js";
import { pool } from "./config/database.js";

ensureRuntimeEnv();

const server = app.listen(env.port, async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`CareerPath API listening on http://localhost:${env.port}`);
    console.log("MySQL connection is ready.");
  } catch (error) {
    console.error("API started, but MySQL is unavailable. Check backend/.env and the MySQL server.", error.message);
  }
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
