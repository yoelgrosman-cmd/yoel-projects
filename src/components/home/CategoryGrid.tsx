import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const categories = [
  {
    name: "אופניים",
    slug: "אופניים",
    description: "הרים, עיר, כביש וילדים",
    icon: "🚴",
    accent: "#4db8e8",
  },
  {
    name: "קסדות",
    slug: "קסדות",
    description: "בטיחות ועיצוב",
    icon: "⛑️",
    accent: "#1e5fa8",
  },
  {
    name: "גלגלים וצמירים",
    slug: "גלגלים-וצמירים",
    description: "ביצועים מקסימליים",
    icon: "⚙️",
    accent: "#4db8e8",
  },
  {
    name: "תיקים",
    slug: "תיקים",
    description: "לכל סוגי הרכיבה",
    icon: "🎒",
    accent: "#1e5fa8",
  },
  {
    name: "בלמים",
    slug: "בלמים",
    description: "עצירה בטוחה ומדויקת",
    icon: "🔧",
    accent: "#4db8e8",
  },
  {
    name: "מנעולים",
    slug: "מנעולים",
    description: "שמור על האופניים שלך",
    icon: "🔒",
    accent: "#1e5fa8",
  },
  {
    name: "פנסים",
    slug: "פנסים",
    description: "ראה ותראה בחשכה",
    icon: "🔦",
    accent: "#4db8e8",
  },
  {
    name: "כלי אחזקה",
    slug: "כלי-אחזקה",
    description: "שמור על האופניים כחדשים",
    icon: "🛠️",
    accent: "#1e5fa8",
  },
];

export default function CategoryGrid() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[#4db8e8] font-bold text-sm uppercase tracking-widest mb-2 block">
              קטגוריות
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#1a2744]">
              מה אתה מחפש?
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-[#1e5fa8] font-bold hover:gap-3 transition-all"
          >
            כל המוצרים <ArrowLeft size={18} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 card-hover"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="text-4xl mb-4">{cat.icon}</div>
              <h3 className="font-black text-[#1a2744] text-lg mb-1">
                {cat.name}
              </h3>
              <p className="text-gray-400 text-sm">{cat.description}</p>
              <div
                className="absolute bottom-0 right-0 w-0 h-1 transition-all duration-300 group-hover:w-full rounded-bl-2xl"
                style={{ backgroundColor: cat.accent }}
              />
              <ArrowLeft
                size={16}
                className="absolute top-4 left-4 text-gray-200 group-hover:text-[#4db8e8] transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
