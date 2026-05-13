const RESEND_API = "https://api.resend.com/emails";

export async function sendResultEmail(
  email: string,
  jobId: string,
  appUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // graceful skip if not configured

  const resultUrl = `${appUrl}/r/${jobId}`;
  const from = process.env.RESEND_FROM_EMAIL ?? "CineAmore <noreply@cineamore.app>";

  await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "🎬 Videonuz hazır!",
      html: buildEmailHtml(resultUrl),
    }),
  });
}

function buildEmailHtml(resultUrl: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Videonuz Hazır</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;">Cine<span style="color:#FF375F;">Amore</span></span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(135deg,rgba(255,55,95,0.12),rgba(191,90,242,0.08));border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 32px;text-align:center;">

              <!-- Icon -->
              <div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(255,55,95,0.25),rgba(191,90,242,0.25));border-radius:20px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;line-height:64px;display:block;">🎬</span>
              </div>

              <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                Videonuz Hazır!
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
                Sinematik aşk hikayeniz oluşturuldu.<br/>Aşağıdaki butona tıklayarak izleyebilirsiniz.
              </p>

              <!-- CTA -->
              <a href="${resultUrl}"
                style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#FF375F,#BF5AF2);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;border-radius:16px;letter-spacing:-0.01em;">
                Videomu İzle &rarr;
              </a>

              <p style="margin:28px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">
                Bu link 7 gün geçerlidir.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);">
                CineAmore &mdash; AI Sinematik Video
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
