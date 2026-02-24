'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div>
      <section className="hero-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-black mb-4">צור קשר</h1>
          <p className="text-xl text-blue-200">אנחנו כאן לכל שאלה ובקשה</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div>
            <h2 className="text-2xl font-black text-blue-900 mb-8">שלח הודעה</h2>

            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">ההודעה נשלחה בהצלחה!</h3>
                <p className="text-green-600">ניצור איתך קשר בהקדם האפשרי</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  שלח הודעה נוספת
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">שם מלא *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                      placeholder="ישראל ישראלי"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                      placeholder="050-0000000"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                    placeholder="email@example.com"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">נושא</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="">בחר נושא...</option>
                    <option>שאלה על מוצר</option>
                    <option>בקשת הצעת מחיר</option>
                    <option>תיקון ושירות</option>
                    <option>בעיה בהזמנה</option>
                    <option>אחר</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">הודעה *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white resize-none"
                    placeholder="כתוב את הודעתך כאן..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors"
                >
                  שלח הודעה
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-blue-900">פרטי החנות</h2>

            {[
              { icon: '📍', title: 'כתובת', lines: ['רחוב הרצל 42', 'תל אביב-יפו, 6578901'] },
              { icon: '📞', title: 'טלפון', lines: ['03-1234567', '050-9876543 (וואטסאפ)'] },
              { icon: '✉️', title: 'אימייל', lines: ['info@bilubikes.co.il', 'service@bilubikes.co.il'] },
              { icon: '🕐', title: 'שעות פתיחה', lines: ['ראשון - חמישי: 10:00 - 19:00', 'שישי: 09:00 - 14:00', 'שבת: סגור'] },
            ].map(({ icon, title, lines }) => (
              <div key={title} className="flex gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <span className="text-3xl">{icon}</span>
                <div>
                  <div className="font-bold text-gray-800 mb-1">{title}</div>
                  {lines.map((l) => (
                    <div key={l} className="text-gray-600 text-sm">{l}</div>
                  ))}
                </div>
              </div>
            ))}

            {/* Map placeholder */}
            <div className="bg-blue-50 rounded-2xl p-8 text-center border border-blue-100">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-blue-700 font-medium">מפה אינטראקטיבית</p>
              <p className="text-blue-500 text-sm mt-1">רחוב הרצל 42, תל אביב</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
