import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                BB
              </div>
              <div>
                <div className="text-lg font-black tracking-tight">BILU BIKES</div>
                <div className="text-xs text-blue-300">חנות אופניים מקצועית</div>
              </div>
            </div>
            <p className="text-blue-300 text-sm leading-relaxed">
              חנות האופניים המובילה בישראל. מבחר ענק של אופניים ואביזרים עם שירות מקצועי ואישי.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">קטגוריות</h3>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/catalog?category=${cat.id}`}
                    className="text-blue-300 hover:text-orange-400 transition-colors text-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">שירות לקוחות</h3>
            <ul className="space-y-2 text-sm text-blue-300">
              <li><Link href="/about" className="hover:text-orange-400 transition-colors">אודות</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">צור קשר</Link></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">מדיניות החזרות</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">תנאי שימוש</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">מדיניות פרטיות</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">משלוחים</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">פרטי קשר</h3>
            <ul className="space-y-3 text-sm text-blue-300">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>רחוב הרצל 42, תל אביב</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:031234567" className="hover:text-orange-400 transition-colors">03-1234567</a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@bilubikes.co.il" className="hover:text-orange-400 transition-colors">info@bilubikes.co.il</a>
              </li>
              <li className="mt-3">
                <div className="font-medium text-white mb-1">שעות פתיחה:</div>
                <div>ראשון - חמישי: 10:00 - 19:00</div>
                <div>שישי: 09:00 - 14:00</div>
                <div>שבת: סגור</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-blue-400">
          <span>© 2024 BILU BIKES. כל הזכויות שמורות.</span>
          <div className="flex items-center gap-4">
            <span>שולם בבטחה עם:</span>
            <div className="flex gap-2">
              {['VISA', 'MC', 'PayPal', 'Bit'].map((pay) => (
                <span key={pay} className="bg-blue-900 px-2 py-1 rounded text-xs font-mono text-blue-300">
                  {pay}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
