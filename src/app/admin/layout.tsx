export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-100 min-h-screen antialiased" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
