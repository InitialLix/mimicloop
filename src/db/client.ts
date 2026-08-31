import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { databaseSchema } from "./schema";

export type SqliteConnection = ReturnType<typeof openDatabase>;

export function openDatabase(filename: string) {
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  if (filename !== ":memory:") sqlite.pragma("journal_mode = WAL");

  return {
    sqlite,
    db: drizzle(sqlite, { schema: databaseSchema }),
    close: () => sqlite.close(),
  };
}

export function migrateDatabase(connection: SqliteConnection, migrationsFolder = "src/db/migrations") {
  migrate(connection.db, { migrationsFolder });
}
