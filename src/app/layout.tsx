import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';

export const metadata: Metadata = {
  title: 'BILU BIKES | חנות אופניים מקצועית',
  description: 'BILU BIKES - חנות אופניים מקצועית. מבחר ענק של אופני הרים, כביש, חשמליים ואביזרים. שירות מקצועי, מחירים טובים ומשלוח לכל הארץ.',
  keywords: 'אופניים, חנות אופניים, BILU BIKES, אופני הרים, אופני כביש, אופניים חשמליים',
  openGraph: {
    title: 'BILU BIKES | חנות אופניים מקצועית',
    description: 'חנות אופניים מקצועית עם מבחר ענק ושירות מעולה',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CartSidebar />
      </body>
    </html>
  );
}
