import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bilu Bikes | בילו בייקס - חנות האופניים שלך",
  description:
    "בילו בייקס - היבואן הרשמי של מותג RL בישראל. אופניים, אביזרים וציוד רכיבה מקצועי. שני סניפים: ראש העין וכפר עציון.",
  keywords: "אופניים, RL, בילו בייקס, חנות אופניים, ישראל",
  openGraph: {
    locale: "he_IL",
    type: "website",
    siteName: "Bilu Bikes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
