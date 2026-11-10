import { timingSafeEqual } from "node:crypto";

// Shared auth for every admin and diagnostic route. The password is checked
// SERVER-SIDE on each request — the UI gate is only cosmetic and must never be
// trusted.

/**
 * Constant-time comparison. `!==` returns as soon as two bytes differ, so the
 * time it takes leaks how much of the password was right — enough, over many
 * attempts, to recover it character by character. Rare over the public
 * internet, but it costs nothing to not have the problem.
 */
function sameSecret(a, b) {
  const x = Buffer.from(String(a ?? ""), "utf8");
  const y = Buffer.from(String(b ?? ""), "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself leak the
  // length, so do equivalent work and return false instead.
  if (x.length !== y.length) {
    const pad = Buffer.alloc(Math.max(x.length, y.length));
    timingSafeEqual(pad, pad);
    return false;
  }
  return timingSafeEqual(x, y);
}

export function checkAuth(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { ok: false, status: 500, error: "ADMIN_PASSWORD not configured" };
  const given = request.headers.get("x-admin-password");
  if (!sameSecret(given, expected)) return { ok: false, status: 401, error: "Unauthorized" };
  return { ok: true };
}

/**
 * checkAuth plus a limit on wrong guesses from one address.
 *
 * One password guards the photo tool, the building list, every captured lead
 * and all the diagnostics, and there was nothing stopping a script trying it a
 * million times. Only failures count, so normal use is never throttled.
 *
 * Async, unlike checkAuth, which is left in place for any caller that cannot
 * await.
 */
export async function checkAuthLimited(request) {
  const { rateLimit, tooMany } = await import("@/lib/rateLimit");

  const auth = checkAuth(request);
  if (auth.ok) return auth;

  const rl = await rateLimit(request, { bucket: "adminfail", max: 10, windowSeconds: 900 });
  if (!rl.ok) {
    return {
      ok: false,
      status: 429,
      error: "Too many failed attempts. Try again later.",
      retryAfter: rl.retryAfter,
      response: tooMany(rl.retryAfter, "Too many failed attempts. Try again later."),
    };
  }
  return auth;
}

export async function mondayCall(query, variables = {}) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: process.env.MONDAY_API_KEY },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}
