"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "דשבורד", icon: LayoutDashboard },
  { href: "/admin/products", label: "מוצרים", icon: Package },
  { href: "/admin/categories", label: "קטגוריות", icon: Tag },
  { href: "/admin/orders", label: "הזמנות", icon: ShoppingBag },
  { href: "/admin/customers", label: "לקוחות", icon: Users },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-[#1a2744] text-white z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="text-2xl font-black">
          BILU<span className="text-[#4db8e8]">BIKES</span>
        </div>
        <div className="text-xs text-white/40 mt-1 font-medium">
          ממשק ניהול
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? "bg-[#1e5fa8] text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold"
        >
          <ArrowLeft size={16} />
          חזרה לחנות
        </Link>
      </div>
    </aside>
  );
}
