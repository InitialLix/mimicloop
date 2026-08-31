import path from "node:path";
import { mkdir } from "node:fs/promises";
import { openDatabase, migrateDatabase } from "../src/db/client.js";

const databasePath = path.resolve(process.env.MIMICLOOP_DB_PATH ?? "data/mimicloop.db");
await mkdir(path.dirname(databasePath), { recursive: true });
const connection = openDatabase(databasePath);
try {
  migrateDatabase(connection);
  console.log(`Migrated ${databasePath}`);
} finally {
  connection.close();
}
