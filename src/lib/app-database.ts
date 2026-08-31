import { mkdir } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { migrateDatabase, openDatabase, type SqliteConnection } from "../db/client";
import {
  ContentRepository,
  loadApprovedCollocationSeed,
  loadSeedBundle,
} from "../db/content-repository";
import {
  COMPETITION_SESSION_HEADER,
  isCompetitionMode,
  isValidCompetitionSessionId,
} from "./competition-mode";

const bootstrapPromises = new Map<string, Promise<void>>();

function localDatabasePath() {
  return process.env.MIMICLOOP_DB_PATH
    ? path.resolve(/* turbopackIgnore: true */ process.env.MIMICLOOP_DB_PATH)
    : path.join(process.cwd(), "data", "mimicloop.db");
}

function competitionDataRoot() {
  return path.resolve(/* turbopackIgnore: true */
    process.env.MIMICLOOP_COMPETITION_DATA_ROOT?.trim()
      || path.join(process.cwd(), ".competition-data"),
  );
}

async function requestSessionId(request?: Request) {
  const value = request
    ? request.headers.get(COMPETITION_SESSION_HEADER)
    : (await headers()).get(COMPETITION_SESSION_HEADER);
  if (!isValidCompetitionSessionId(value)) {
    throw new Error("A valid competition session is required");
  }
  return value;
}

async function seedApprovedContent(databasePath: string) {
  const existing = bootstrapPromises.get(databasePath);
  if (existing) return existing;
  const current = (async () => {
    await mkdir(path.dirname(databasePath), { recursive: true });
    const [bundle, approvedCollocations] = await Promise.all([
      loadSeedBundle(),
      loadApprovedCollocationSeed(),
    ]);
    const connection = openDatabase(databasePath);
    try {
      migrateDatabase(connection, path.join(process.cwd(), "src", "db", "migrations"));
      const repository = new ContentRepository(connection);
      repository.importSeeds({
        sources: bundle.sources,
        candidates: [],
        approvedCards: bundle.approvedCards,
      });
      repository.importApprovedCollocations(approvedCollocations);
    } finally {
      connection.close();
    }
  })();
  bootstrapPromises.set(databasePath, current);
  try {
    await current;
  } catch (error) {
    bootstrapPromises.delete(databasePath);
    throw error;
  }
}

export async function resolveAppDatabasePath(request?: Request) {
  if (!isCompetitionMode()) return localDatabasePath();
  const sessionId = await requestSessionId(request);
  const root = competitionDataRoot();
  const databasePath = path.resolve(root, "sessions", `${sessionId}.db`);
  const sessionsRoot = `${path.resolve(root, "sessions")}${path.sep}`;
  if (!databasePath.startsWith(sessionsRoot)) throw new Error("Invalid competition database path");
  await seedApprovedContent(databasePath);
  return databasePath;
}

export async function openAppDatabase(request?: Request): Promise<SqliteConnection> {
  const databasePath = await resolveAppDatabasePath(request);
  const connection = openDatabase(databasePath);
  migrateDatabase(connection, path.join(process.cwd(), "src", "db", "migrations"));
  return connection;
}

export async function checkCompetitionStorage() {
  if (!isCompetitionMode()) return { mode: "local" as const };
  const root = competitionDataRoot();
  await mkdir(path.join(root, "sessions"), { recursive: true });
  return { mode: "competition" as const, rootReady: true };
}
