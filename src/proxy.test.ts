import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

let proxyFn: typeof import("./proxy").proxy;

beforeEach(async () => {
  // Polyfill btoa for Node test environment.
  if (typeof btoa === "undefined") {
    (globalThis as any).btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
  }
  process.env.APP_PASSWORD = "secretpw";
  vi.resetModules();
  const mod = await import("./proxy");
  proxyFn = mod.proxy;
});

const makeRequest = (headers: Record<string, string> = {}, path = "/") =>
  new NextRequest(new Request(`http://localhost${path}`, { headers }));

describe("proxy middleware", () => {
  test("blocks when no auth header provided", () => {
    const res = proxyFn(makeRequest());
    expect(res.status).toBe(401);
  });

  test("allows when auth header matches", () => {
    const auth = "Basic " + btoa("user:secretpw");
    const res = proxyFn(makeRequest({ authorization: auth }));
    expect(res.status).toBe(200);
  });

  test("passes through when APP_PASSWORD is unset", async () => {
    process.env.APP_PASSWORD = "";
    vi.resetModules();
    const mod = await import("./proxy");
    const res = mod.proxy(makeRequest());
    expect(res.status).toBe(200);
  });
});
