import { NextResponse, type NextRequest } from "next/server";

const password = process.env.APP_PASSWORD;

export function proxy(req: NextRequest) {
  // If no password set, let everything through.
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization") || "";
  const expected = "Basic " + btoa(`user:${password}`);

  if (authHeader === expected) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Yahtzee Preview"',
    },
  });
}
