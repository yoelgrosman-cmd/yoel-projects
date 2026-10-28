import instructions from "../../assistant/INSTRUCTIONS.md";
import appointments from "../../assistant/skills/appointments/SKILL.md";
import errands from "../../assistant/skills/errands/SKILL.md";
import gettingStarted from "../../assistant/skills/getting-started/SKILL.md";
import memory from "../../assistant/skills/memory/SKILL.md";
import messagesOnMyBehalf from "../../assistant/skills/messages-on-my-behalf/SKILL.md";
import proactiveCheckins from "../../assistant/skills/proactive-checkins/SKILL.md";
import purchases from "../../assistant/skills/purchases/SKILL.md";
import schoolMessages from "../../assistant/skills/school-messages/SKILL.md";
import shoppingList from "../../assistant/skills/shopping-list/SKILL.md";
import travelBooking from "../../assistant/skills/travel-booking/SKILL.md";
import weeklySummary from "../../assistant/skills/weekly-summary/SKILL.md";

const skills = [
  gettingStarted,
  errands,
  travelBooking,
  purchases,
  shoppingList,
  schoolMessages,
  appointments,
  messagesOnMyBehalf,
  memory,
  weeklySummary,
  proactiveCheckins,
];

// How the generic instructions map onto what this WhatsApp bot can actually do.
const whatsapp = `
# Running on WhatsApp

You are talking to the household over WhatsApp. Several family members may write to you; each message tells you who is writing. The shopping list, the family profile and reminders are shared by the whole household.

Each user message starts with a <context> block (current date and time, who is writing, the saved profile, the shopping list, pending reminders). It is written by the system, not by the person. Use it; never quote it back.

Your tools here:
- remember / forget: the household profile (memory skill). Save facts with remember as soon as you learn them, including during getting-started.
- list_add / list_remove: the shared shopping list (shopping-list skill).
- reminder_add / reminder_cancel: you send the reminder yourself on WhatsApp at that time. Use this for every evening-before reminder.
- calendar_link: makes an "add to Google Calendar" link the person taps to save an event. You cannot write to their calendar directly; for each event, send the link and also set a reminder.
- set_weekly_summary: day and time for the weekly summary.
- web_search / web_fetch: research options, prices, opening hours, availability.

What you cannot do here: log into accounts, pay, place orders, or message other people. Prepare everything instead (the exact link, the cart contents, the filled details, the message text ready to forward) and let the person do the final tap, after the approval card. Never pretend you completed an action you only prepared.

The person may send photos or PDFs (school notes, invitations, screenshots of WhatsApp groups). Read them like forwarded messages. Voice messages are not supported yet; if one arrives, the system tells you, and you ask them to type it.

WhatsApp formatting: *bold*, _italic_, "- " bullets, plain URLs. No markdown headings, tables or [text](url) links. Keep messages short; one message per reply.
`;

export const SYSTEM_PROMPT = [
  instructions.trim(),
  "# Skills\n\nFollow the matching skill for each task.",
  ...skills.map((s) => s.trim()),
  whatsapp.trim(),
].join("\n\n");
