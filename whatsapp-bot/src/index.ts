import { allowedNumbers, Household, type Env } from "./household";
import { parseWebhook, verifySignature } from "./whatsapp";

export { Household };

function household(env: Env) {
  return env.HOUSEHOLD.get(env.HOUSEHOLD.idFromName("household"));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/webhook") return new Response("ok");

    // Meta's one-time webhook verification.
    if (request.method === "GET") {
      const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === env.WHATSAPP_VERIFY_TOKEN;
      return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("forbidden", { status: 403 });
    }
    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

    const body = await request.text();
    if (!(await verifySignature(env, body, request.headers.get("X-Hub-Signature-256")))) {
      return new Response("bad signature", { status: 401 });
    }
    // Only household members can talk to the assistant; everyone else is ignored.
    const allowed = new Set(allowedNumbers(env));
    const messages = parseWebhook(JSON.parse(body)).filter((m) => allowed.has(m.from));
    if (messages.length) await household(env).enqueue(messages);
    return new Response("ok");
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(household(env).tick());
  },
} satisfies ExportedHandler<Env>;
