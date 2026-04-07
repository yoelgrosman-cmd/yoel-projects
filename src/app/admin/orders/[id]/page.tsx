import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import OrderStatusUpdater from "@/components/admin/OrderStatusUpdater";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      shippingAddress: true,
      user: true,
    },
  });

  if (!order) notFound();

  const paymentLabel: Record<string, string> = {
    UNPAID: "לא שולם",
    PAID: "שולם",
    REFUNDED: "הוחזר",
  };

  const paymentColor: Record<string, string> = {
    UNPAID: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1a2744]">
            הזמנה {order.orderNumber}
          </h1>
          <p className="text-gray-400 mt-1">
            {order.createdAt.toLocaleDateString("he-IL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-5">פריטים</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold text-[#1a2744]">{item.name}</p>
                    {item.variant && (
                      <p className="text-sm text-gray-400">{item.variant}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.quantity} × {formatPrice(item.price)}</p>
                    <p className="font-black text-[#1e5fa8]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>סכום ביניים</span>
                <span className="font-bold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>משלוח</span>
                <span className="font-bold">
                  {order.shippingCost === 0 ? "חינם" : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-black text-[#1a2744] pt-2 border-t border-gray-100">
                <span>סה״כ</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-4">לקוח</h2>
            <div className="space-y-2 text-sm">
              <p className="font-bold text-[#1a2744]">{order.customerName}</p>
              <p className="text-gray-600">{order.customerEmail}</p>
              <p className="text-gray-600" dir="ltr">{order.customerPhone}</p>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-4">משלוח</h2>
            <p className="font-bold text-gray-700 mb-2">
              {order.shippingType === "PICKUP" ? "איסוף עצמי" : "משלוח לבית"}
            </p>
            {order.branchPickup && (
              <p className="text-gray-600 text-sm">סניף: {order.branchPickup}</p>
            )}
            {order.shippingAddress && (
              <p className="text-gray-600 text-sm">
                {order.shippingAddress.street}, {order.shippingAddress.city}
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-4">תשלום</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${paymentColor[order.paymentStatus]}`}>
              {paymentLabel[order.paymentStatus]}
            </span>
            {order.tranzilaRef && (
              <p className="text-xs text-gray-400 mt-2">אסמכתא: {order.tranzilaRef}</p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-[#1a2744] text-lg mb-3">הערות</h2>
              <p className="text-gray-600 text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
