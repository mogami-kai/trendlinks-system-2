/** Brevo (メール送信) ラッパ (FR-6 PDF送付 / 通知フォールバック) */

interface SendResult {
  ok: boolean;
  error?: string;
}

interface Attachment {
  name: string;
  contentBase64: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY 未設定" };

  const from = process.env.MAIL_FROM || "Trendlinks <no-reply@example.com>";
  const match = from.match(/^(.*)<(.+)>$/);
  const sender = match
    ? { name: match[1].trim(), email: match[2].trim() }
    : { email: from.trim() };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        attachment: opts.attachments?.map((a) => ({
          name: a.name,
          content: a.contentBase64,
        })),
      }),
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
