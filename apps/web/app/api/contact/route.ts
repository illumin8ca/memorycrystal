import { NextRequest, NextResponse } from "next/server";

const INTENTS = ["general", "enterprise", "billing", "refund"] as const;
type ContactIntent = (typeof INTENTS)[number];

type ContactPayload = {
  name: string;
  email: string;
  intent: ContactIntent;
  subject?: string;
  message: string;
  userId?: string;
  plan?: string;
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  source?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalize(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    const name = normalize(body.name);
    const email = normalize(body.email).toLowerCase();
    const intent = normalize(body.intent) as ContactIntent;
    const subject = normalize(body.subject);
    const message = normalize(body.message);
    const userId = normalize(body.userId);
    const plan = normalize(body.plan);
    const polarCustomerId = normalize(body.polarCustomerId);
    const polarSubscriptionId = normalize(body.polarSubscriptionId);
    const source = normalize(body.source);

    if (!name || !email || !message || !INTENTS.includes(intent)) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json({ error: "Message must be between 10 and 5000 characters." }, { status: 400 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Contact service is not configured." }, { status: 500 });
    }

    const supportInbox = process.env.SUPPORT_EMAIL ?? "support@memorycrystal.ai";
    const labelMap: Record<ContactIntent, string> = {
      general: "General Contact",
      enterprise: "Enterprise / Higher Usage",
      billing: "Billing Support",
      refund: "Refund Request",
    };

    const resolvedSubject = subject || `${labelMap[intent]} — ${name}`;

    const text = [
      `Intent: ${labelMap[intent]} (${intent})`,
      `From: ${name} <${email}>`,
      userId ? `User ID: ${userId}` : null,
      plan ? `Plan: ${plan}` : null,
      polarCustomerId ? `Polar Customer ID: ${polarCustomerId}` : null,
      polarSubscriptionId ? `Polar Subscription ID: ${polarSubscriptionId}` : null,
      source ? `Source: ${source}` : null,
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
  <h2>New Memory Crystal contact request</h2>
  <p><strong>Intent:</strong> ${labelMap[intent]} (${intent})</p>
  <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
  ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : ""}
  ${plan ? `<p><strong>Plan:</strong> ${plan}</p>` : ""}
  ${polarCustomerId ? `<p><strong>Polar Customer ID:</strong> ${polarCustomerId}</p>` : ""}
  ${polarSubscriptionId ? `<p><strong>Polar Subscription ID:</strong> ${polarSubscriptionId}</p>` : ""}
  ${source ? `<p><strong>Source:</strong> ${source}</p>` : ""}
  <hr />
  <p style="white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>
</div>`;

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: supportInbox }] }],
        from: { email: "noreply@memorycrystal.ai", name: "Memory Crystal" },
        reply_to: { email, name },
        subject: `[${labelMap[intent]}] ${resolvedSubject}`,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Email send failed: ${response.status} ${err}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
