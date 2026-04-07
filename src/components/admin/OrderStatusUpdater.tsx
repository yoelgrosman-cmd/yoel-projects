"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  { value: "PENDING", label: "ממתין" },
  { value: "PROCESSING", label: "בעיבוד" },
  { value: "SHIPPED", label: "נשלח" },
  { value: "DELIVERED", label: "נמסר" },
  { value: "CANCELLED", label: "בוטל" },
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-[#1e5fa8]"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
        className="btn-primary disabled:opacity-50"
      >
        {loading ? "מעדכן..." : "עדכן סטטוס"}
      </button>
    </div>
  );
}
