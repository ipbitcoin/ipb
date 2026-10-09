/**
 * Send a transactional email through Resend.
 * Returns false (and logs) when RESEND_API_KEY is not configured, so local
 * development works without an email provider.
 */
export async function sendEmail(message: {
  html: string;
  subject: string;
  to: string;
}): Promise<boolean> {
  const config = useRuntimeConfig();
  if (!config.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — email not sent");
    return false;
  }

  await $fetch("https://api.resend.com/emails", {
    body: {
      from: config.EMAIL_FROM || "IPB <no-reply@institutobitcoin.pt>",
      html: message.html,
      subject: message.subject,
      to: message.to,
    },
    headers: { Authorization: `Bearer ${config.RESEND_API_KEY}` },
    method: "POST",
  });
  return true;
}
