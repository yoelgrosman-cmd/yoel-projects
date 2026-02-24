import Link from 'next/link';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-black mb-4">אודות BILU BIKES</h1>
          <p className="text-xl text-blue-200">יותר מ-15 שנות אהבה לאופניים</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl font-black text-blue-900 mb-6">הסיפור שלנו</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                BILU BIKES נוסדה בשנת 2009 על ידי בילו גרוסמן, רוכב אופניים נלהב שחלם על חנות אופניים שונה מכולן - מקום שבו שירות אישי, ידע מקצועי ומוצרים איכותיים מגיעים יחד.
              </p>
              <p>
                מאז הקמתה, BILU BIKES צמחה להיות אחת מחנויות האופניים המובילות בישראל עם מאות לקוחות מרוצים ואלפי מוצרים במלאי.
              </p>
              <p>
                אנחנו מאמינים שרכיבה על אופניים היא לא רק ספורט - זו דרך חיים. לכן אנחנו כאן לעזור לכל רוכב, מתחיל ומנוסה, למצוא את האופניים המושלמים עבורו.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-12 text-center">
            <div className="text-8xl mb-4">🚴</div>
            <div className="text-6xl font-black text-blue-900">15+</div>
            <div className="text-blue-600 text-xl mt-2">שנות ניסיון</div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-blue-900 text-center mb-12">הערכים שלנו</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏆', title: 'איכות ללא פשרות', desc: 'אנחנו עובדים רק עם המותגים הטובים בעולם ומוכרים רק מוצרים מקוריים עם אחריות מלאה.' },
              { icon: '❤️', title: 'אהבה לרכיבה', desc: 'הצוות שלנו מורכב מרוכבים נלהבים שיודעים להמליץ מניסיון אישי על כל מוצר.' },
              { icon: '🤝', title: 'שירות אישי', desc: 'כל לקוח מקבל ייעוץ אישי ומקצועי. אנחנו כאן בשבילך גם אחרי הקנייה.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="font-bold text-xl text-gray-800 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-blue-900 text-center mb-12">הצוות שלנו</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'בילו גרוסמן', role: 'מייסד ומנכ"ל', emoji: '👨‍💼' },
              { name: 'דנה לוי', role: 'מנהלת מכירות', emoji: '👩‍💼' },
              { name: 'יוסי כהן', role: 'טכנאי ראשי', emoji: '🔧' },
              { name: 'מאיה שמיר', role: 'שירות לקוחות', emoji: '😊' },
            ].map(({ name, role, emoji }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">{emoji}</div>
                <div className="font-bold text-gray-800">{name}</div>
                <div className="text-sm text-gray-500 mt-1">{role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-black mb-4">בואו לבקר אותנו</h2>
          <p className="text-orange-100 mb-8 text-lg">רחוב הרצל 42, תל אביב | א&apos;-ה&apos; 10:00-19:00 | שישי 09:00-14:00</p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors"
          >
            צור קשר
          </Link>
        </div>
      </div>
    </div>
  );
}
