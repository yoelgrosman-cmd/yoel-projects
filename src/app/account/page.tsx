import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, User, MapPin, LogOut } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true },
      },
    },
  });

  if (!user) redirect("/login");

  const statusLabel: Record<string, string> = {
    PENDING: "ממתין",
    PROCESSING: "בעיבוד",
    SHIPPED: "נשלח",
    DELIVERED: "נמסר",
    CANCELLED: "בוטל",
  };

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-20">
        {/* Header */}
        <div className="bg-[#1a2744] py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-black text-white mb-2">
              שלום, {user.name || "לקוח יקר"} 👋
            </h1>
            <p className="text-white/50">{user.email}</p>
          </div>
        </div>

        <div className="container-custom py-10">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside>
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-2">
                {[
                  { href: "/account", label: "דשבורד", icon: User },
                  { href: "/account/orders", label: "ההזמנות שלי", icon: Package },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <item.icon size={18} className="text-[#1e5fa8]" />
                    {item.label}
                  </Link>
                ))}
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors w-full text-right"
                  >
                    <LogOut size={18} />
                    יציאה
                  </button>
                </form>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "הזמנות", value: user.orders.length.toString() },
                  {
                    label: "סה״כ הוצאה",
                    value: formatPrice(
                      user.orders.reduce((s, o) => s + o.total, 0)
                    ),
                  },
                  {
                    label: "הזמנה אחרונה",
                    value:
                      user.orders[0]?.createdAt.toLocaleDateString("he-IL") ||
                      "—",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-6 shadow-sm text-center"
                  >
                    <div className="text-2xl font-black text-[#1a2744] mb-1">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#1a2744]">
                    הזמנות אחרונות
                  </h2>
                  <Link
                    href="/account/orders"
                    className="text-[#1e5fa8] font-bold text-sm hover:underline"
                  >
                    כל ההזמנות
                  </Link>
                </div>

                {user.orders.length === 0 ? (
                  <div className="text-center py-10">
                    <Package size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">
                      עוד לא ביצעת הזמנות
                    </p>
                    <Link href="/products" className="btn-primary mt-4 inline-block">
                      לקנייה עכשיו
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.orders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/account/orders/${order.id}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1e5fa8] transition-colors"
                      >
                        <div>
                          <p className="font-bold text-[#1a2744]">
                            #{order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-400">
                            {order.createdAt.toLocaleDateString("he-IL")} ·{" "}
                            {order.items.length} פריטים
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              statusColor[order.status]
                            }`}
                          >
                            {statusLabel[order.status]}
                          </span>
                          <span className="font-black text-[#1a2744]">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
