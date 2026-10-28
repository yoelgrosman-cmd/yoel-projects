import { DurableObject } from "cloudflare:workers";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent, type ToolHost, type Turn } from "./agent";
import { calendarLink, formatLocal, localDate, localParts, localToUtc, WEEKDAYS } from "./time";
import { downloadMedia, markReadAndTyping, sendText, type InboundMessage, type WhatsAppEnv } from "./whatsapp";

export interface Env extends WhatsAppEnv {
  ANTHROPIC_API_KEY: string;
  WHATSAPP_VERIFY_TOKEN: string;
  ALLOWED_NUMBERS: string;
  TIMEZONE: string;
  HOUSEHOLD: DurableObjectNamespace<Household>;
}

interface Fact {
  id: number;
  fact: string;
}
interface Item {
  name: string;
  quantity?: string;
  category: string;
}
interface Reminder {
  id: number;
  at: number;
  text: string;
  to: string[];
}
interface Weekly {
  day: number | null; // 0 = Sunday, null = off
  time: string;
}

const HISTORY_TURNS = 40;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function allowedNumbers(env: Env): string[] {
  return env.ALLOWED_NUMBERS.split(",").map((n) => n.replace(/\D/g, "")).filter(Boolean);
}

// One instance holds the whole household: shared profile, list and reminders,
// plus a conversation history per family member.
export class Household extends DurableObject<Env> {
  private get tz() {
    return this.env.TIMEZONE || "Asia/Jerusalem";
  }

  private async get<T>(key: string, fallback: T): Promise<T> {
    return ((await this.ctx.storage.get<T>(key)) ?? fallback) as T;
  }

  private async nextId(): Promise<number> {
    const id = (await this.get("nextId", 1)) as number;
    await this.ctx.storage.put("nextId", id + 1);
    return id;
  }

  async enqueue(messages: InboundMessage[]): Promise<void> {
    const seen = await this.get<string[]>("seen", []);
    const inbox = await this.get<InboundMessage[]>("inbox", []);
    for (const m of messages) {
      if (seen.includes(m.id)) continue; // Meta re-delivers webhooks
      seen.push(m.id);
      inbox.push(m);
    }
    await this.ctx.storage.put({ seen: seen.slice(-300), inbox });
    if (inbox.length && (await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now());
  }

  // Inbound messages are handled in the alarm so the webhook can answer at once.
  async alarm(): Promise<void> {
    await this.drain();
  }

  async tick(): Promise<void> {
    await this.drain();
    await this.sendDueReminders();
    await this.maybeWeeklySummary();
  }

  private async drain(): Promise<void> {
    for (;;) {
      const inbox = await this.get<InboundMessage[]>("inbox", []);
      const msg = inbox.shift();
      if (!msg) return;
      await this.ctx.storage.put("inbox", inbox);
      try {
        await this.handle(msg);
      } catch (e) {
        console.error("handle failed", e);
        await sendText(this.env, msg.from, "משהו השתבש אצלי, אפשר לנסות שוב בעוד רגע?").catch(() => {});
      }
    }
  }

  private async handle(msg: InboundMessage): Promise<void> {
    await this.ctx.storage.put(`lastInbound:${msg.from}`, Date.now());
    if (msg.name) {
      const names = await this.get<Record<string, string>>("names", {});
      if (names[msg.from] !== msg.name) await this.ctx.storage.put("names", { ...names, [msg.from]: msg.name });
    }
    await markReadAndTyping(this.env, msg.id);

    const { blocks, summary } = await this.userContent(msg);
    const history = await this.get<Turn[]>(`history:${msg.from}`, []);
    const context = await this.context(msg.from);
    const reply = await runAgent(this.env.ANTHROPIC_API_KEY, history, [{ type: "text", text: context }, ...blocks], this.host(msg.from));

    await this.saveTurns(msg.from, summary, reply);
    await sendText(this.env, msg.from, reply);
  }

  private async userContent(msg: InboundMessage): Promise<{ blocks: Anthropic.Beta.Messages.BetaContentBlockParam[]; summary: string }> {
    if (msg.text !== undefined) return { blocks: [{ type: "text", text: msg.text || "(empty message)" }], summary: msg.text };
    const caption = msg.caption ? `\n${msg.caption}` : "";
    if (msg.type === "audio") {
      const note = "[The person sent a voice message. Voice messages aren't supported yet.]";
      return { blocks: [{ type: "text", text: note }], summary: note };
    }
    if (msg.mediaId && (msg.type === "image" || msg.type === "document")) {
      const media = await downloadMedia(this.env, msg.mediaId);
      if (IMAGE_TYPES.includes(media.mimeType)) {
        return {
          blocks: [
            { type: "image", source: { type: "base64", media_type: media.mimeType as "image/jpeg", data: media.data } },
            { type: "text", text: `[photo]${caption}` },
          ],
          summary: `[sent a photo]${caption}`,
        };
      }
      if (media.mimeType === "application/pdf") {
        return {
          blocks: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: media.data } },
            { type: "text", text: `[PDF: ${msg.filename ?? "document"}]${caption}` },
          ],
          summary: `[sent a PDF: ${msg.filename ?? "document"}]${caption}`,
        };
      }
    }
    const note = `[The person sent a ${msg.type}${msg.mimeType ? ` (${msg.mimeType})` : ""} that can't be read here.]${caption}`;
    return { blocks: [{ type: "text", text: note }], summary: note };
  }

  // History keeps plain text only, so earlier turns stay byte-identical and cacheable.
  private async saveTurns(phone: string, user: string, assistant: string): Promise<void> {
    const history = await this.get<Turn[]>(`history:${phone}`, []);
    const last = history[history.length - 1];
    if (last?.role === "user") last.content += `\n${user}`;
    else history.push({ role: "user", content: user });
    history.push({ role: "assistant", content: assistant });
    let trimmed = history.slice(-HISTORY_TURNS);
    while (trimmed.length && trimmed[0].role !== "user") trimmed = trimmed.slice(1);
    await this.ctx.storage.put(`history:${phone}`, trimmed);
  }

  private async context(phone: string): Promise<string> {
    const names = await this.get<Record<string, string>>("names", {});
    const profile = await this.get<Fact[]>("profile", []);
    const list = await this.get<Item[]>("list", []);
    const reminders = await this.get<Reminder[]>("reminders", []);
    const weekly = await this.get<Weekly>("weekly", { day: 6, time: "20:40" });
    const who = (p: string) => `${names[p] || "unknown name"} (+${p})`;

    const byCategory = new Map<string, string[]>();
    for (const i of list) byCategory.set(i.category, [...(byCategory.get(i.category) ?? []), i.quantity ? `${i.name} ×${i.quantity}` : i.name]);

    return [
      "<context>",
      `Now: ${formatLocal(Date.now(), this.tz)}, time zone ${this.tz}`,
      `Writing: ${who(phone)}`,
      `Household members on WhatsApp: ${allowedNumbers(this.env).map(who).join(", ")}`,
      "Profile:",
      profile.length ? profile.map((f) => `  [${f.id}] ${f.fact}`).join("\n") : "  (empty: this is a new household, run getting-started)",
      "Shopping list:",
      list.length ? [...byCategory].map(([c, items]) => `  ${c}: ${items.join(", ")}`).join("\n") : "  (empty)",
      "Pending reminders:",
      reminders.length
        ? reminders.map((r) => `  [${r.id}] ${formatLocal(r.at, this.tz)} → ${r.text} (to ${r.to.map(who).join(", ")})`).join("\n")
        : "  (none)",
      `Weekly summary: ${weekly.day === null ? "off" : `${WEEKDAYS[weekly.day]} ${weekly.time}`}`,
      "</context>",
    ].join("\n");
  }

  private host(phone: string): ToolHost {
    return { runTool: (name, input) => this.runTool(phone, name, input) };
  }

  private async runTool(phone: string, name: string, input: any): Promise<string> {
    switch (name) {
      case "remember": {
        const profile = await this.get<Fact[]>("profile", []);
        const id = await this.nextId();
        profile.push({ id, fact: String(input.fact) });
        await this.ctx.storage.put("profile", profile);
        return `saved as [${id}]`;
      }
      case "forget": {
        const profile = await this.get<Fact[]>("profile", []);
        const rest = profile.filter((f) => f.id !== input.id);
        if (rest.length === profile.length) throw new Error(`no fact with id ${input.id}`);
        await this.ctx.storage.put("profile", rest);
        return "deleted";
      }
      case "list_add": {
        const list = await this.get<Item[]>("list", []);
        for (const item of input.items as Item[]) {
          const existing = list.find((i) => i.name.trim().toLowerCase() === item.name.trim().toLowerCase());
          if (existing) {
            if (item.quantity) existing.quantity = item.quantity;
          } else list.push({ name: item.name.trim(), quantity: item.quantity, category: item.category });
        }
        await this.ctx.storage.put("list", list);
        return `list now has ${list.length} items`;
      }
      case "list_remove": {
        const names = (input.names as string[]).map((n) => n.trim().toLowerCase());
        const list = await this.get<Item[]>("list", []);
        const rest = names.includes("*") ? [] : list.filter((i) => !names.includes(i.name.toLowerCase()));
        await this.ctx.storage.put("list", rest);
        return `removed ${list.length - rest.length}; ${rest.length} left`;
      }
      case "reminder_add": {
        const at = localToUtc(String(input.when), this.tz);
        if (at < Date.now() - 60_000) throw new Error("that time is in the past");
        const reminders = await this.get<Reminder[]>("reminders", []);
        const id = await this.nextId();
        const to = input.recipients === "everyone" ? allowedNumbers(this.env) : [phone];
        reminders.push({ id, at, text: String(input.text), to });
        reminders.sort((a, b) => a.at - b.at);
        await this.ctx.storage.put("reminders", reminders);
        return `reminder [${id}] set for ${formatLocal(at, this.tz)}`;
      }
      case "reminder_cancel": {
        const reminders = await this.get<Reminder[]>("reminders", []);
        const rest = reminders.filter((r) => r.id !== input.id);
        if (rest.length === reminders.length) throw new Error(`no reminder with id ${input.id}`);
        await this.ctx.storage.put("reminders", rest);
        return "cancelled";
      }
      case "calendar_link":
        return calendarLink({
          title: input.title,
          start: input.start,
          end: input.end,
          allDay: input.all_day,
          details: input.details,
          location: input.location,
          tz: this.tz,
        });
      case "set_weekly_summary": {
        const day = input.day === "off" ? null : WEEKDAYS.indexOf(input.day);
        if (!/^\d{2}:\d{2}$/.test(input.time)) throw new Error("time must be HH:mm");
        await this.ctx.storage.put("weekly", { day, time: input.time } satisfies Weekly);
        return "saved";
      }
      default:
        throw new Error(`unknown tool ${name}`);
    }
  }

  private async sendDueReminders(): Promise<void> {
    const reminders = await this.get<Reminder[]>("reminders", []);
    const now = Date.now();
    const due = reminders.filter((r) => r.at <= now);
    if (!due.length) return;
    // Remove first so a failure never sends the same reminder twice.
    await this.ctx.storage.put("reminders", reminders.filter((r) => r.at > now));
    for (const r of due) {
      for (const to of r.to) await sendText(this.env, to, `⏰ ${r.text}`).catch((e) => console.error("reminder failed", e));
    }
  }

  private async maybeWeeklySummary(): Promise<void> {
    const weekly = await this.get<Weekly>("weekly", { day: 6, time: "20:40" });
    if (weekly.day === null) return;
    const now = Date.now();
    const p = localParts(now, this.tz);
    const hhmm = `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
    const today = localDate(now, this.tz);
    if (p.weekday !== weekly.day || hhmm < weekly.time || (await this.get("lastWeekly", "")) === today) return;
    await this.ctx.storage.put("lastWeekly", today);
    if (!(await this.get<Fact[]>("profile", [])).length) return; // nothing to summarize before setup

    const members = allowedNumbers(this.env);
    const primary = members[0];
    const request = "[Automatic weekly summary time. Follow the weekly-summary skill for the household. This message is from the system, not the person.]";
    const history = await this.get<Turn[]>(`history:${primary}`, []);
    const reply = await runAgent(
      this.env.ANTHROPIC_API_KEY,
      history,
      [{ type: "text", text: await this.context(primary) }, { type: "text", text: request }],
      this.host(primary),
    );
    await this.saveTurns(primary, request, reply);
    for (const to of members) await sendText(this.env, to, reply).catch((e) => console.error("summary failed", e));
  }
}
