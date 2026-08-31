import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openAppDatabase } from "../../src/lib/app-database";
import { COMPETITION_SESSION_HEADER } from "../../src/lib/competition-mode";

const originalMode = process.env.MIMICLOOP_COMPETITION_MODE;
const originalRoot = process.env.MIMICLOOP_COMPETITION_DATA_ROOT;
const temporaryRoots: string[] = [];

function sessionRequest(id: string) {
  return new Request("http://localhost/test", { headers: { [COMPETITION_SESSION_HEADER]: id } });
}

afterEach(async () => {
  if (originalMode === undefined) delete process.env.MIMICLOOP_COMPETITION_MODE;
  else process.env.MIMICLOOP_COMPETITION_MODE = originalMode;
  if (originalRoot === undefined) delete process.env.MIMICLOOP_COMPETITION_DATA_ROOT;
  else process.env.MIMICLOOP_COMPETITION_DATA_ROOT = originalRoot;
  await Promise.all(temporaryRoots.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("competition database isolation", () => {
  it("seeds approved content but keeps learner progress in separate session files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mimicloop-competition-"));
    temporaryRoots.push(root);
    process.env.MIMICLOOP_COMPETITION_MODE = "true";
    process.env.MIMICLOOP_COMPETITION_DATA_ROOT = root;
    const first = sessionRequest("02d678a0-95e4-422a-84bd-c1f475f4286d");
    const second = sessionRequest("97e4cf1a-b4d2-455a-a103-c73d47173b1a");

    const firstDb = await openAppDatabase(first);
    const card = firstDb.sqlite.prepare("SELECT id FROM cards ORDER BY id LIMIT 1").get() as { id: string };
    const sourceCount = (firstDb.sqlite.prepare("SELECT COUNT(*) AS count FROM source_essays").get() as { count: number }).count;
    const candidateCount = (firstDb.sqlite.prepare("SELECT COUNT(*) AS count FROM candidates").get() as { count: number }).count;
    firstDb.sqlite.prepare("UPDATE review_states SET learning_stage = 'learning' WHERE card_id = ?").run(card.id);
    firstDb.close();

    const secondDb = await openAppDatabase(second);
    const secondState = secondDb.sqlite.prepare("SELECT learning_stage AS stage FROM review_states WHERE card_id = ?").get(card.id) as { stage: string };
    secondDb.close();

    expect(sourceCount).toBeGreaterThan(0);
    expect(candidateCount).toBe(0);
    expect(secondState.stage).toBe("new");
  });
});
