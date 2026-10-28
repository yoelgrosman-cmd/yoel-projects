export interface WhatsAppEnv {
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_APP_SECRET: string;
  GRAPH_VERSION: string;
  // Optional approved template with one body variable, used when the 24-hour
  // customer-service window is closed (reminders, weekly summary).
  WHATSAPP_TEMPLATE_NAME?: string;
  WHATSAPP_TEMPLATE_LANG?: string;
}

export interface InboundMessage {
  id: string;
  from: string;
  name: string;
  type: string;
  text?: string;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
}

const MAX_TEXT = 4000; // WhatsApp's limit is 4096 characters per text message.

function graph(env: WhatsAppEnv, path: string): string {
  return `https://graph.facebook.com/${env.GRAPH_VERSION}/${path}`;
}

export async function verifySignature(env: WhatsAppEnv, body: string, header: string | null): Promise<boolean> {
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.WHATSAPP_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice("sha256=".length);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

// Pulls the messages out of a webhook payload; status updates are ignored.
export function parseWebhook(payload: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      const names = new Map<string, string>();
      for (const c of value?.contacts ?? []) names.set(c.wa_id, c.profile?.name ?? "");
      for (const m of value?.messages ?? []) {
        const msg: InboundMessage = { id: m.id, from: m.from, name: names.get(m.from) ?? "", type: m.type };
        if (m.type === "text") msg.text = m.text?.body;
        else if (m.type === "image" || m.type === "document" || m.type === "audio" || m.type === "sticker") {
          const media = m[m.type];
          msg.mediaId = media?.id;
          msg.mimeType = media?.mime_type;
          msg.caption = media?.caption;
          msg.filename = media?.filename;
        } else if (m.type === "button") msg.text = m.button?.text;
        else if (m.type === "interactive") msg.text = m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title;
        out.push(msg);
      }
    }
  }
  return out;
}

export async function downloadMedia(env: WhatsAppEnv, mediaId: string): Promise<{ data: string; mimeType: string }> {
  const auth = { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` };
  const meta = await fetch(graph(env, mediaId), { headers: auth });
  if (!meta.ok) throw new Error(`media lookup failed: ${meta.status}`);
  const { url, mime_type } = (await meta.json()) as { url: string; mime_type: string };
  const file = await fetch(url, { headers: auth });
  if (!file.ok) throw new Error(`media download failed: ${file.status}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(binary), mimeType: mime_type.split(";")[0] };
}

async function post(env: WhatsAppEnv, body: Record<string, unknown>): Promise<Response> {
  return fetch(graph(env, `${env.WHATSAPP_PHONE_NUMBER_ID}/messages`), {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
}

// Marks the message as read and shows "typing…" while the assistant works.
export async function markReadAndTyping(env: WhatsAppEnv, messageId: string): Promise<void> {
  await post(env, { status: "read", message_id: messageId, typing_indicator: { type: "text" } }).catch(() => {});
}

function split(text: string): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > MAX_TEXT) {
    let cut = rest.lastIndexOf("\n", MAX_TEXT);
    if (cut < MAX_TEXT / 2) cut = MAX_TEXT;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

// Sends free text; if the 24-hour window is closed, falls back to the template.
export async function sendText(env: WhatsAppEnv, to: string, text: string): Promise<void> {
  for (const part of split(text)) {
    const res = await post(env, { to, type: "text", text: { body: part, preview_url: true } });
    if (res.ok) continue;
    const err = (await res.json().catch(() => ({}))) as { error?: { code?: number; message?: string } };
    if (err.error?.code === 131047 && env.WHATSAPP_TEMPLATE_NAME) {
      await sendTemplate(env, to, text);
      return;
    }
    throw new Error(`send failed (${res.status}): ${err.error?.message ?? "unknown"}`);
  }
}

async function sendTemplate(env: WhatsAppEnv, to: string, text: string): Promise<void> {
  // Template variables may not contain newlines or tabs.
  const flat = text.replace(/\s*\n+\s*/g, " · ").replace(/\t/g, " ").replace(/ {4,}/g, "   ").slice(0, 900);
  const res = await post(env, {
    to,
    type: "template",
    template: {
      name: env.WHATSAPP_TEMPLATE_NAME,
      language: { code: env.WHATSAPP_TEMPLATE_LANG || "he" },
      components: [{ type: "body", parameters: [{ type: "text", text: flat }] }],
    },
  });
  if (!res.ok) throw new Error(`template send failed (${res.status}): ${await res.text()}`);
}
