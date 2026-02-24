import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import NewsletterForm from '@/components/NewsletterForm';
import { getFeaturedProducts } from '@/lib/products';
import { CATEGORIES } from '@/lib/categories';

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 border-4 border-white rounded-full" />
          <div className="absolute bottom-10 left-10 w-48 h-48 border-4 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-orange-400 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-full px-4 py-1.5 text-sm text-orange-300 mb-6">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              מבצע קיץ - עד 30% הנחה!
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              האופניים שלך
              <br />
              <span className="text-orange-400">מחכים לך</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-200 mb-8 leading-relaxed">
              מבחר ענק של אופני הרים, כביש, חשמליים ואביזרים. שירות מקצועי, מחירים
              תחרותיים ומשלוח מהיר לכל הארץ.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
              >
                לקטלוג המוצרים
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg border border-white/20 transition-all hover:scale-105"
              >
                צור קשר
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { num: '500+', label: 'מוצרים במלאי' },
                { num: '15+', label: 'שנות ניסיון' },
                { num: '10,000+', label: 'לקוחות מרוצים' },
                { num: '24h', label: 'שירות לקוחות' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="text-2xl md:text-3xl font-black text-orange-400">{num}</div>
                  <div className="text-blue-300 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-blue-900">קטגוריות</h2>
            <p className="text-gray-500 mt-1">מצא את האופניים המושלמים עבורך</p>
          </div>
          <Link href="/catalog" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
            כל הקטגוריות
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const emoji =
              cat.id === 'mountain' ? '⛰️' :
              cat.id === 'road' ? '🚴' :
              cat.id === 'electric' ? '⚡' :
              cat.id === 'city' ? '🏙️' :
              cat.id === 'kids' ? '👦' : '🔧';
            const colors: Record<string, string> = {
              mountain: 'from-green-600 to-emerald-800',
              road: 'from-blue-600 to-blue-800',
              electric: 'from-yellow-500 to-orange-600',
              city: 'from-purple-600 to-indigo-800',
              kids: 'from-pink-500 to-rose-600',
              accessories: 'from-gray-600 to-gray-800',
            };
            return (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className={`bg-gradient-to-br ${colors[cat.id]} text-white rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:scale-105 transition-all shadow-lg hover:shadow-xl group`}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{emoji}</span>
                <div>
                  <div className="font-bold text-sm leading-tight">{cat.name}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Banner */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">אופניים חשמליים - מהפכת הנסיעה</h2>
            <p className="text-orange-100 mt-2">הכנס לעידן החדש של רכיבה חכמה. טווח עד 120 ק&quot;מ בטעינה אחת.</p>
          </div>
          <Link
            href="/catalog?category=electric"
            className="shrink-0 px-8 py-3.5 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors"
          >
            לאופניים חשמליים ←
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-blue-900">מוצרים מומלצים</h2>
            <p className="text-gray-500 mt-1">הנבחרת שלנו לעונה זו</p>
          </div>
          <Link href="/catalog" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
            כל המוצרים
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-blue-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12">למה BILU BIKES?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🏆', title: 'מוצרים מקוריים', desc: 'כל המוצרים מקוריים עם אחריות מלאה מהיצרן' },
              { icon: '🚚', title: 'משלוח מהיר', desc: 'משלוח לכל הארץ תוך 2-4 ימי עסקים' },
              { icon: '🔧', title: 'שירות מקצועי', desc: 'צוות טכנאים מוסמך לכל תיקון ותחזוקה' },
              { icon: '💳', title: 'תשלום בתשלומים', desc: 'עד 12 תשלומים ללא ריבית בכרטיסי אשראי' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
                <p className="text-blue-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-center text-gray-500 mb-8">המותגים שלנו</h2>
        <div className="flex flex-wrap justify-center gap-6 items-center">
          {['Trek', 'Specialized', 'Giant', 'Cannondale', 'Merida', 'Scott', 'Shimano', 'Giro'].map((brand) => (
            <Link
              key={brand}
              href={`/catalog?brand=${brand}`}
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:border-blue-500 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-950 text-white py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-3">הישארו מעודכנים</h2>
          <p className="text-blue-300 mb-8">קבלו עדכונים על מוצרים חדשים, מבצעים ואירועים</p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
