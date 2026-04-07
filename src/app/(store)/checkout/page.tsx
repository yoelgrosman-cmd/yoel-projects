"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { MapPin, Truck, Package } from "lucide-react";

type ShippingType = "PICKUP" | "DELIVERY";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingType: "DELIVERY" as ShippingType,
    branchPickup: "ראש העין",
    address: { street: "", city: "", zipCode: "" },
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const subtotal = totalPrice();
  const shippingCost =
    form.shippingType === "DELIVERY" && subtotal < 250 ? 35 : 0;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            variant: i.variant,
          })),
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          shippingType: form.shippingType,
          branchPickup:
            form.shippingType === "PICKUP" ? form.branchPickup : null,
          address:
            form.shippingType === "DELIVERY" ? form.address : null,
          notes: form.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה ביצירת הזמנה");
      } else {
        setPaymentUrl(data.paymentUrl);
        clearCart();
      }
    } catch {
      setError("שגיאת חיבור. נסה שוב.");
    }
    setLoading(false);
  };

  if (items.length === 0 && !paymentUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">העגלה ריקה</p>
          <Link href="/products" className="btn-primary">
            המשך לקנות
          </Link>
        </div>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container-custom max-w-2xl">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-[#1a2744] py-6 px-8">
              <h1 className="text-2xl font-black text-white">תשלום מאובטח</h1>
              <p className="text-white/60 text-sm mt-1">
                הפרטים שלך מוצפנים ומאובטחים
              </p>
            </div>
            <div className="p-2">
              <iframe
                src={paymentUrl}
                className="w-full"
                style={{ height: "500px", border: "none" }}
                title="תשלום מאובטח"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-custom">
        <h1 className="text-3xl font-black text-[#1a2744] mb-8">
          השלמת הזמנה
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal details */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#1a2744] mb-5">
                  פרטים אישיים
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      שם מלא *
                    </label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, customerName: e.target.value }))
                      }
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      טלפון *
                    </label>
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          customerPhone: e.target.value,
                        }))
                      }
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                      dir="ltr"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      אימייל *
                    </label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          customerEmail: e.target.value,
                        }))
                      }
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#1a2744] mb-5">
                  אופן קבלת ההזמנה
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      value: "DELIVERY",
                      label: "משלוח לבית",
                      icon: Truck,
                      desc: subtotal >= 250 ? "חינם!" : "₪35",
                    },
                    {
                      value: "PICKUP",
                      label: "איסוף עצמי",
                      icon: Package,
                      desc: "חינם תמיד",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          shippingType: opt.value as ShippingType,
                        }))
                      }
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        form.shippingType === opt.value
                          ? "border-[#1e5fa8] bg-[#1e5fa8]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          form.shippingType === opt.value
                            ? "bg-[#1e5fa8] text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <opt.icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-[#1a2744]">{opt.label}</p>
                        <p className="text-sm text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {form.shippingType === "PICKUP" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      בחר סניף לאיסוף
                    </label>
                    <div className="space-y-3">
                      {["ראש העין", "כפר עציון"].map((branch) => (
                        <button
                          key={branch}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, branchPickup: branch }))
                          }
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                            form.branchPickup === branch
                              ? "border-[#1e5fa8] bg-[#1e5fa8]/5"
                              : "border-gray-200"
                          }`}
                        >
                          <MapPin
                            size={18}
                            className={
                              form.branchPickup === branch
                                ? "text-[#1e5fa8]"
                                : "text-gray-400"
                            }
                          />
                          <span className="font-bold text-[#1a2744]">
                            {branch}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.shippingType === "DELIVERY" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        רחוב ומספר בית *
                      </label>
                      <input
                        type="text"
                        value={form.address.street}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            address: { ...f.address, street: e.target.value },
                          }))
                        }
                        required
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          עיר *
                        </label>
                        <input
                          type="text"
                          value={form.address.city}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              address: { ...f.address, city: e.target.value },
                            }))
                          }
                          required
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          מיקוד
                        </label>
                        <input
                          type="text"
                          value={form.address.zipCode}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              address: {
                                ...f.address,
                                zipCode: e.target.value,
                              },
                            }))
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  הערות להזמנה
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8] resize-none"
                  placeholder="הוראות מיוחדות, בקשות..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg py-4"
              >
                {loading ? "מעבד..." : `לתשלום — ${formatPrice(total)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-[#1a2744] mb-5">
                סיכום הזמנה
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-3"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#1a2744] truncate">
                        {item.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-gray-400">{item.variant}</p>
                      )}
                      <p className="text-sm font-black text-[#1e5fa8] mt-1">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>סכום ביניים</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>משלוח</span>
                  <span className="font-bold">
                    {shippingCost === 0 ? "חינם" : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-black text-[#1a2744] border-t border-gray-100 pt-3">
                  <span>סה״כ</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
