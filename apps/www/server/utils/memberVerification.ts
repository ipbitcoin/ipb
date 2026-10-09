import { createHash } from "node:crypto";

/** Code hash is salted with the email and the server secret. */
export function hashCode(email: string, code: string): string {
  const { SERVICE_KEY } = useRuntimeConfig();
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${code}:${SERVICE_KEY}`)
    .digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
