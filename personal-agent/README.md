# Personal Agent

סוכן אישי שכותבים לו בהודעה מה צריך, והוא מבצע את הכל מתחילה ועד סוף: הזמנות, נסיעות, קניות, טפסים ומעקבים. הוא בנוי לפי הדפוס של הסוכן Instinct, עם חיזוק בנקודות שבהן הסוקרים מתחו עליו ביקורת: כרטיס אישור מחייב לפני כל תשלום או שליחה, יוזמה מוגבלת, ובלי לשמור סיסמאות בצ'אט.

## איך יוצרים אותו באפליקציית Claude

1. צרו סוכן חדש בשם `Personal Agent`.
2. **תיאור:** את השדה `description` מתוך `.claude-plugin/plugin.json`.
3. **Instructions:** את כל התוכן של `INSTRUCTIONS.md`.
4. **Skills:** לכל תיקייה תחת `skills/`, skill חדש עם תוכן ה-`SKILL.md`:
   `getting-started`, `errands`, `travel-booking`, `purchases`, `memory`, `proactive-checkins`, `messages-on-my-behalf`.
5. **Plugins:** חברו Google Calendar, ואם רוצים גם Gmail וגלישה בדפדפן (Claude in Chrome).
6. **Publish**, ואחר כך שיחה ראשונה. הסוכן יתחיל עם `getting-started`.
7. (אופציונלי) משימה מתוזמנת לתקציר בוקר עם הפרומפט "Morning brief".
