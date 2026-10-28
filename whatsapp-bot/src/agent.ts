import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt";

type MessageParam = Anthropic.Beta.Messages.BetaMessageParam;
type ContentBlockParam = Anthropic.Beta.Messages.BetaContentBlockParam;
type ToolResult = Anthropic.Beta.Messages.BetaToolResultBlockParam;

const MODEL = "claude-opus-5-5";
const MAX_ROUNDS = 12;

const CATEGORIES = ["produce", "dairy", "meat & fish", "bakery", "pantry", "frozen", "cleaning", "kids/school", "pharmacy", "other"];

const TOOLS: Anthropic.Beta.Messages.BetaToolUnion[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: 5, user_location: { type: "approximate", country: "IL", timezone: "Asia/Jerusalem" } },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5 },
  {
    name: "remember",
    description: "Save one lasting fact about the household to the shared profile (people, birthdays, school/gan and class, address, stores, preferences, reminder time, approval rules). One short fact per call.",
    input_schema: { type: "object", properties: { fact: { type: "string" } }, required: ["fact"], additionalProperties: false },
  },
  {
    name: "forget",
    description: "Delete a saved profile fact by its id (ids are shown in the context block).",
    input_schema: { type: "object", properties: { id: { type: "integer" } }, required: ["id"], additionalProperties: false },
  },
  {
    name: "list_add",
    description: "Add items to the shared shopping list. Merges with items already on the list.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Item name in the language the person used." },
              quantity: { type: "string", description: "Optional, e.g. \"2\", \"1 kg\"." },
              category: { type: "string", enum: CATEGORIES },
            },
            required: ["name", "category"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
  {
    name: "list_remove",
    description: "Remove items from the shopping list by name (bought, not needed). Pass [\"*\"] to clear the whole list.",
    input_schema: { type: "object", properties: { names: { type: "array", items: { type: "string" } } }, required: ["names"], additionalProperties: false },
  },
  {
    name: "reminder_add",
    description: "Schedule a WhatsApp reminder that you will send at the given local time (household time zone). Use for evening-before reminders, deadlines and anything the person asks to be reminded of.",
    input_schema: {
      type: "object",
      properties: {
        when: { type: "string", description: "Local date and time, YYYY-MM-DDTHH:mm." },
        text: { type: "string", description: "The reminder as it should be sent, short, in the person's language." },
        recipients: { type: "string", enum: ["me", "everyone"], description: "\"me\" = the person writing; \"everyone\" = all household members." },
      },
      required: ["when", "text", "recipients"],
      additionalProperties: false,
    },
  },
  {
    name: "reminder_cancel",
    description: "Cancel a pending reminder by id (ids are shown in the context block).",
    input_schema: { type: "object", properties: { id: { type: "integer" } }, required: ["id"], additionalProperties: false },
  },
  {
    name: "calendar_link",
    description: "Create an \"add to Google Calendar\" link for an event. Send the returned link to the person so they can save it with one tap.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        start: { type: "string", description: "Local YYYY-MM-DDTHH:mm (or YYYY-MM-DD for all-day)." },
        end: { type: "string", description: "Optional local end, same format. Defaults to one hour after start." },
        all_day: { type: "boolean" },
        details: { type: "string" },
        location: { type: "string" },
      },
      required: ["title", "start"],
      additionalProperties: false,
    },
  },
  {
    name: "set_weekly_summary",
    description: "Set when the weekly summary is sent (local time), or turn it off.",
    input_schema: {
      type: "object",
      properties: {
        day: { type: "string", enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "off"] },
        time: { type: "string", description: "HH:mm, 24h." },
      },
      required: ["day", "time"],
      additionalProperties: false,
    },
  },
];

export interface ToolHost {
  runTool(name: string, input: any): Promise<string>;
}

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

function textOf(content: Anthropic.Beta.Messages.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

// Runs one assistant turn: history (plain text) + the new user content, looping
// over tool calls until Claude answers. Returns the reply text.
export async function runAgent(apiKey: string, history: Turn[], user: ContentBlockParam[], host: ToolHost): Promise<string> {
  const client = new Anthropic({ apiKey });
  const messages: MessageParam[] = [...history.map((t) => ({ role: t.role, content: t.content })), { role: "user", content: user }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return "מצטער, בזה אני לא יכול לעזור.";
    }
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "pause_turn") continue;
    if (response.stop_reason !== "tool_use") {
      return textOf(response.content) || "👍";
    }

    const results: ToolResult[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        results.push({ type: "tool_result", tool_use_id: block.id, content: await host.runTool(block.name, block.input) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: block.id, content: String((e as Error).message ?? e), is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return "זה לקח לי יותר מדי צעדים. אפשר לנסח שוב בקצרה?";
}
