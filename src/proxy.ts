import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  COMPETITION_SESSION_COOKIE,
  COMPETITION_SESSION_HEADER,
  COMPETITION_SESSION_MAX_AGE_SECONDS,
  isCompetitionInternalPath,
  isCompetitionMode,
  signCompetitionSession,
  verifyCompetitionSession,
} from "./lib/competition-mode";

export function proxy(request: NextRequest) {
  if (!isCompetitionMode()) return NextResponse.next();

  if (isCompetitionInternalPath(request.nextUrl.pathname)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" },
    });
  }

  if (request.nextUrl.pathname === "/api/health") {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  const current = verifyCompetitionSession(request.cookies.get(COMPETITION_SESSION_COOKIE)?.value);
  const sessionId = current ?? randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(COMPETITION_SESSION_HEADER, sessionId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!current) {
    response.cookies.set(COMPETITION_SESSION_COOKIE, signCompetitionSession(sessionId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COMPETITION_SESSION_MAX_AGE_SECONDS,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|mimicloop-logo.png).*)"],
};
