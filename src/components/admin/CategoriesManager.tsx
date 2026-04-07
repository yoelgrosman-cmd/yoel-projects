"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, ChevronDown, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  parentId: string | null;
  _count: { products: number };
  children: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    order: number;
    _count: { products: number };
  }[];
}

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "" });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        parentId: form.parentId || null,
      }),
    });
    if (res.ok) {
      setForm({ name: "", slug: "", parentId: "" });
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <Plus size={18} />
          קטגוריה חדשה
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <h2 className="font-bold text-[#1a2744] text-lg mb-5">קטגוריה חדשה</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">שם *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                dir="ltr"
                placeholder="auto"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">קטגוריית אב</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
              >
                <option value="">ראשי (אין הורה)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "שומר..." : "שמור"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [cat.id]: !e[cat.id] }))
                  }
                  className="text-gray-400"
                >
                  {cat.children.length > 0 ? (
                    expanded[cat.id] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )
                  ) : (
                    <span className="w-4" />
                  )}
                </button>
                <span className="font-bold text-[#1a2744]">{cat.name}</span>
                <span className="text-xs text-gray-400 font-medium">
                  {cat._count.products} מוצרים
                </span>
              </div>
              <span className="text-xs text-gray-400" dir="ltr">
                /{cat.slug}
              </span>
            </div>

            {expanded[cat.id] &&
              cat.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between pr-14 pl-6 py-3 border-b border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">↳</span>
                    <span className="font-medium text-gray-700">{child.name}</span>
                    <span className="text-xs text-gray-400">
                      {child._count.products} מוצרים
                    </span>
                  </div>
                  <span className="text-xs text-gray-400" dir="ltr">
                    /{child.slug}
                  </span>
                </div>
              ))}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-16 text-gray-400">אין קטגוריות עדיין</div>
        )}
      </div>
    </div>
  );
}
