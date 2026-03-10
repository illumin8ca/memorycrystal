export async function sendVerificationEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("Missing SENDGRID_API_KEY");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Verify your Memory Crystal account</title>
</head>
<body style="margin:0;padding:0;background:#0d1820;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1820;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0f1e29;border:1px solid rgba(255,255,255,0.1);max-width:480px;width:100%;">
        <tr><td style="padding:40px 40px 24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#4CC1E9;font-size:24px;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:bold;">
                ◈ MEMORY CRYSTAL
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="color:rgba(255,255,255,0.9);font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your verification code:
          </p>
          <div style="background:#0d1820;border:1px solid #2180D6;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:bold;letter-spacing:12px;color:#4CC1E9;">
              ${code}
            </span>
          </div>
          <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0 0 8px;">
            This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);">
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
            Memory Crystal · Persistent memory for your AI agents · <a href="https://memorycrystal.ai" style="color:#2180D6;text-decoration:none;">memorycrystal.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@memorycrystal.ai", name: "Memory Crystal" },
      subject: `${code} — your Memory Crystal verification code`,
      content: [
        {
          type: "text/plain",
          value: `Your Memory Crystal verification code is: ${code}\n\nThis code expires in 15 minutes.`,
        },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SendGrid error: ${response.status} ${err}`);
  }
}

export async function sendPasswordResetEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("Missing SENDGRID_API_KEY");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reset your Memory Crystal password</title>
</head>
<body style="margin:0;padding:0;background:#0d1820;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1820;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0f1e29;border:1px solid rgba(255,255,255,0.1);max-width:480px;width:100%;">
        <tr><td style="padding:40px 40px 24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#4CC1E9;font-size:24px;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:bold;">
                ◈ MEMORY CRYSTAL
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="color:rgba(255,255,255,0.9);font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your password reset code:
          </p>
          <div style="background:#0d1820;border:1px solid #2180D6;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:bold;letter-spacing:12px;color:#4CC1E9;">
              ${code}
            </span>
          </div>
          <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0 0 8px;">
            This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);">
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
            Memory Crystal · Persistent memory for your AI agents · <a href="https://memorycrystal.ai" style="color:#2180D6;text-decoration:none;">memorycrystal.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@memorycrystal.ai", name: "Memory Crystal" },
      subject: `${code} — reset your Memory Crystal password`,
      content: [
        {
          type: "text/plain",
          value: `Your Memory Crystal password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
        },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SendGrid error: ${response.status} ${err}`);
  }
}
