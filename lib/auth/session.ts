import { createHmac, timingSafeEqual } from "crypto";
import type { SessionPayload } from "./types";

const DEV_FALLBACK_SECRET = "riskos-dev-insecure-secret-do-not-use-in-prod";

let warned = false;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (!warned) {
      // eslint-disable-next-line no-console
      console.warn(
        "[auth] SESSION_SECRET is not set. Falling back to an insecure development " +
          "secret. Set SESSION_SECRET in your environment before deploying."
      );
      warned = true;
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * Creates a signed session token of the form "<base64url(payload)>.<hmacHex>".
 * `payload.exp` should be a unix-epoch-seconds expiry.
 */
export function createSessionToken(payload: SessionPayload): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a session token's signature and expiry. Returns the payload if
 * valid, or null if the token is malformed, tampered with, or expired.
 */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;

  const expectedSignature = sign(encodedPayload);
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (typeof payload.exp !== "number" || Date.now() / 1000 > payload.exp) {
      return null;
    }
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
