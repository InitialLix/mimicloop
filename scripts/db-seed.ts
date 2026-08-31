import path from "node:path";
import { mkdir } from "node:fs/promises";
import { openDatabase, migrateDatabase } from "../src/db/client.js";
import {
  ContentRepository,
  loadApprovedCollocationSeed,
  loadCollocationCandidateSeed,
  loadSeedBundle,
} from "../src/db/content-repository.js";

const databasePath = path.resolve(process.env.MIMICLOOP_DB_PATH ?? "data/mimicloop.db");
await mkdir(path.dirname(databasePath), { recursive: true });
const connection = openDatabase(databasePath);
try {
  migrateDatabase(connection);
  const repository = new ContentRepository(connection);
  const result = repository.importSeeds(await loadSeedBundle());
  const collocations = repository.importCollocationCandidates(await loadCollocationCandidateSeed());
  const approvedCollocations = repository.importApprovedCollocations(await loadApprovedCollocationSeed());
  const counts = repository.getCounts();
  console.log(JSON.stringify({ databasePath, content: result, collocations, approvedCollocations, counts }, null, 2));
} finally {
  connection.close();
}
