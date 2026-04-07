import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

async function getDashboardStats() {
  const [
    totalProducts,
    totalOrders,
    totalCustomers,
    recentOrders,
    pendingOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const revenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: "PAID" },
  });

  return {
    totalProducts,
    totalOrders,
    totalCustomers,
    recentOrders,
    pendingOrders,
    totalRevenue: revenue._sum.total || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

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

  const cards = [
    {
      label: "מוצרים פעילים",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: "bg-blue-500",
      href: "/admin/products",
    },
    {
      label: "סה״כ הזמנות",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "bg-purple-500",
      href: "/admin/orders",
    },
    {
      label: "לקוחות רשומים",
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "bg-green-500",
      href: "/admin/customers",
    },
    {
      label: "הכנסות כוללות",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-[#1e5fa8]",
      href: "/admin/orders",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1a2744]">דשבורד</h1>
          <p className="text-gray-400 mt-1">סקירה כללית של החנות</p>
        </div>
        {stats.pendingOrders > 0 && (
          <Link
            href="/admin/orders?status=PENDING"
            className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-yellow-100 transition-colors"
          >
            <Clock size={16} />
            {stats.pendingOrders} הזמנות ממתינות
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <card.icon size={22} className="text-white" />
            </div>
            <div className="text-2xl font-black text-[#1a2744] mb-1">
              {card.value}
            </div>
            <div className="text-gray-400 text-sm font-medium">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-[#1a2744]">הזמנות אחרונות</h2>
          <Link
            href="/admin/orders"
            className="text-[#1e5fa8] font-bold text-sm hover:underline"
          >
            כל ההזמנות
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-right text-sm text-gray-400 font-bold border-b border-gray-100">
                <th className="px-6 py-3">מספר הזמנה</th>
                <th className="px-6 py-3">לקוח</th>
                <th className="px-6 py-3">סכום</th>
                <th className="px-6 py-3">סטטוס</th>
                <th className="px-6 py-3">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-bold text-[#1e5fa8] hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 font-black text-[#1a2744]">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        statusColor[order.status]
                      }`}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {order.createdAt.toLocaleDateString("he-IL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentOrders.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              אין הזמנות עדיין
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
