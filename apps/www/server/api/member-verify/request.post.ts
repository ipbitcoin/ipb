import { randomInt } from "node:crypto";

import { api } from "@ipb/backend/api";

/**
 * Email a one-time code to an IPB member so they can unlock the member price.
 * Always answers `{ ok: true }` — whether or not the email belongs to a member
 * — so this endpoint can't be used to find out who is a member.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ email?: string; locale?: string } | undefined>(
    event
  );
  const email = body?.email?.trim();
  const isPt = body?.locale !== "en";

  if (!(email && EMAIL_REGEX.test(email))) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { send } = await convexClient().mutation(
    api.memberVerification.request,
    {
      codeHash: hashCode(email, code),
      email,
      serviceKey: config.SERVICE_KEY,
    }
  );

  if (!send) {
    return { ok: true };
  }

  try {
    const sent = await sendEmail({
      html: isPt
        ? `<p>O seu código de verificação IPB é:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>Válido durante 10 minutos. Se não pediu este código, ignore este e-mail.</p>`
        : `<p>Your IPB verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>Valid for 10 minutes. If you didn't request it, ignore this email.</p>`,
      subject: isPt ? "Código de verificação IPB" : "IPB verification code",
      to: email,
    });
    // Local dev without an email provider: hand the code back so it's testable.
    if (!sent && import.meta.dev) {
      return { devCode: code, ok: true };
    }
  } catch (error: unknown) {
    console.error("[member-verify] Failed to send email:", error);
  }
  return { ok: true };
});
