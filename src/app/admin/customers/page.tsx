import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1a2744]">לקוחות</h1>
        <p className="text-gray-400 mt-1">{customers.length} לקוחות רשומים</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-right text-sm text-gray-400 font-bold bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-4">שם</th>
              <th className="px-4 py-4">אימייל</th>
              <th className="px-4 py-4">טלפון</th>
              <th className="px-4 py-4">הזמנות</th>
              <th className="px-4 py-4">הצטרפות</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-bold text-[#1a2744]">
                  {customer.name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {customer.email}
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm" dir="ltr">
                  {customer.phone || "—"}
                </td>
                <td className="px-4 py-3 font-bold text-[#1e5fa8]">
                  {customer._count.orders}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {customer.createdAt.toLocaleDateString("he-IL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-16 text-gray-400">אין לקוחות עדיין</div>
        )}
      </div>
    </div>
  );
}
