import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);

  const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1a2744]">הזמנות</h1>
          <p className="text-gray-400 mt-1">{total} הזמנות</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href="/admin/orders"
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
            !sp.status
              ? "bg-[#1a2744] text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          הכל
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              sp.status === s
                ? "bg-[#1a2744] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {statusLabel[s]}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-right text-sm text-gray-400 font-bold bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-4">מספר הזמנה</th>
              <th className="px-4 py-4">לקוח</th>
              <th className="px-4 py-4">פריטים</th>
              <th className="px-4 py-4">סכום</th>
              <th className="px-4 py-4">משלוח</th>
              <th className="px-4 py-4">סטטוס</th>
              <th className="px-4 py-4">תאריך</th>
              <th className="px-4 py-4">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-bold text-[#1e5fa8]">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-[#1a2744] text-sm">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {order.items.length} פריטים
                </td>
                <td className="px-4 py-3 font-black text-[#1a2744]">
                  {formatPrice(order.total)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {order.shippingType === "PICKUP"
                    ? `איסוף — ${order.branchPickup}`
                    : "משלוח"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      statusColor[order.status]
                    }`}
                  >
                    {statusLabel[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {order.createdAt.toLocaleDateString("he-IL")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-[#1e5fa8] font-bold text-sm hover:underline"
                  >
                    פרטים
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-16 text-gray-400">אין הזמנות</div>
        )}
      </div>

      {Math.ceil(total / pageSize) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}${sp.status ? `&status=${sp.status}` : ""}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                p === page
                  ? "bg-[#1a2744] text-white"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
