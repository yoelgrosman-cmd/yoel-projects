# Family Assistant

עוזרת משפחתית: רשימת קניות, הודעות מבית הספר/הגן ליומן עם תזכורת, עגלת קניות לאישור, סיכום שבועי וקביעת תורים.

## איך יוצרים אותה באפליקציית Claude

1. צרו עוזר/סוכן חדש. **שם:** `Family Assistant`.
2. **תיאור:** העתיקו את ה-`description` מתוך `.claude-plugin/plugin.json`.
3. **Instructions:** העתיקו את כל התוכן של `INSTRUCTIONS.md`.
4. **Skills:** לכל תיקייה תחת `skills/` הוסיפו skill חדש והדביקו את תוכן ה-`SKILL.md` שלה (כולל השורות שבין `---`):
   - `getting-started` – הגדרה ראשונית
   - `shopping-list` – רשימת קניות
   - `school-messages` – הודעות מבית ספר/גן ליומן
   - `shopping-cart` – עגלת קניות עם אישור סכום
   - `weekly-summary` – סיכום שבועי
   - `appointments` – קביעת תורים
5. **Plugins / Connectors:** חברו Google Calendar (חובה), ואם יש – Gmail / Google Drive.
6. לחצו **Publish**, ופתחו שיחה ראשונה – העוזרת תריץ את `getting-started`.
7. לסיכום השבועי: הגדירו משימה מתוזמנת (למשל מוצאי שבת 21:00) עם הפרומפט "Send my weekly summary".

## כ-plugin ל-Claude Code

התיקייה בנויה גם כ-plugin תקני (`.claude-plugin/plugin.json` + `skills/`), כך שאפשר להתקין אותה ישירות.
