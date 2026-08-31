import { createHmac, timingSafeEqual } from "node:crypto";

export const COMPETITION_SESSION_COOKIE = "mimicloop_judge_session";
export const COMPETITION_SESSION_HEADER = "x-mimicloop-session-id";
export const COMPETITION_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCompetitionMode() {
  return process.env.MIMICLOOP_COMPETITION_MODE === "true";
}

function signingSecret() {
  const secret = process.env.MIMICLOOP_SESSION_SIGNING_SECRET?.trim();
  if (!secret) throw new Error("MIMICLOOP_SESSION_SIGNING_SECRET is required in competition mode");
  return secret;
}

function signature(sessionId: string) {
  return createHmac("sha256", signingSecret()).update(sessionId).digest("base64url");
}

export function isValidCompetitionSessionId(value: string | null | undefined): value is string {
  return typeof value === "string" && sessionIdPattern.test(value);
}

export function signCompetitionSession(sessionId: string) {
  if (!isValidCompetitionSessionId(sessionId)) throw new Error("Invalid competition session id");
  return `${sessionId}.${signature(sessionId)}`;
}

export function verifyCompetitionSession(value: string | null | undefined): string | null {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator < 1) return null;
  const sessionId = value.slice(0, separator);
  const provided = value.slice(separator + 1);
  if (!isValidCompetitionSessionId(sessionId) || !provided) return null;
  const expected = signature(sessionId);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) return null;
  return timingSafeEqual(expectedBuffer, providedBuffer) ? sessionId : null;
}

export function isCompetitionInternalPath(pathname: string) {
  return pathname === "/settings"
    || pathname.startsWith("/settings/")
    || pathname === "/candidates"
    || pathname.startsWith("/candidates/")
    || pathname.startsWith("/api/candidates/")
    || pathname.startsWith("/api/collocations/candidates/");
}
