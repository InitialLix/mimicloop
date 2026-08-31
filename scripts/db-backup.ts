import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { openDatabase, migrateDatabase } from "../src/db/client.js";
import { exportFullBackup } from "../src/db/backup-service.js";

const databasePath = path.resolve(process.env.MIMICLOOP_DB_PATH ?? "data/mimicloop.db");
const outputDirectory = path.resolve(process.env.MIMICLOOP_BACKUP_DIR ?? "backups");
const connection = openDatabase(databasePath);
try {
  migrateDatabase(connection);
  const backup = exportFullBackup(connection);
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, `mimicloop-${backup.backup_id}.json`);
  await writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  console.log(outputPath);
} finally {
  connection.close();
}
