import { readFile } from "node:fs/promises";
import path from "node:path";
import { openDatabase, migrateDatabase } from "../src/db/client.js";
import { restoreFullBackup, type FullBackup } from "../src/db/backup-service.js";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: npm run db:restore -- <backup.json>");
const databasePath = path.resolve(process.env.MIMICLOOP_DB_PATH ?? "data/mimicloop.db");
const connection = openDatabase(databasePath);
try {
  migrateDatabase(connection);
  const backup = JSON.parse(await readFile(path.resolve(inputPath), "utf8")) as FullBackup;
  const result = await restoreFullBackup(connection, backup);
  console.log(JSON.stringify({ databasePath, ...result }, null, 2));
} finally {
  connection.close();
}
