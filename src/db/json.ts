import { createHash } from "node:crypto";

export type JsonObject = Record<string, unknown>;

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as JsonObject).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value), "utf8").digest("hex");
}
