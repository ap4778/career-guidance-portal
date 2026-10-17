import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const connection = await mysql.createConnection({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  multipleStatements: true,
  charset: "utf8mb4",
});
try {
  const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  await connection.query(schema);
  console.log("Database schema and clearly labeled demo seed data are ready.");
} finally {
  await connection.end();
}
