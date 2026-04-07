import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Share2 as Instagram, Share as Facebook } from "lucide-react";

const branches = [
  {
    name: "ראש העין",
    address: "שילה 90, ראש העין",
    phone: "050-0000000",
    hours: "א׳-ה׳ 10:00-19:00, ו׳ 09:00-14:00",
  },
  {
    name: "כפר עציון",
    address: "מתחם חצר הכפר, כפר עציון",
    phone: "050-0000001",
    hours: "א׳-ה׳ 10:00-19:00, ו׳ 09:00-14:00",
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a2744] text-white">
      {/* Top bar */}
      <div className="bg-[#4db8e8] py-3">
        <div className="container-custom flex items-center justify-center gap-3 text-[#1a2744] font-bold">
          <span>משלוח חינם לכל הארץ בקניה מעל ₪250</span>
          <span>•</span>
          <span>היבואן הרשמי של RL בישראל</span>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="text-3xl font-black mb-4">
              BILU<span className="text-[#4db8e8]">BIKES</span>
            </div>
            <p className="text-white/60 leading-relaxed mb-6">
              חנות האופניים המקצועית שלך. מעל 10 שנות ניסיון, היבואן הרשמי של
              מותג RL בישראל. שני סניפים לשירותך.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#4db8e8] hover:text-[#1a2744] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#4db8e8] hover:text-[#1a2744] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-[#4db8e8]">ניווט מהיר</h3>
            <ul className="space-y-3">
              {[
                { href: "/products", label: "כל המוצרים" },
                { href: "/categories/אופניים", label: "אופניים" },
                { href: "/categories/קסדות", label: "קסדות" },
                { href: "/categories/אביזרים", label: "אביזרים" },
                { href: "/about", label: "אודות בילו בייקס" },
                { href: "/contact", label: "צור קשר" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#4db8e8] transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Branches */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-[#4db8e8]">הסניפים שלנו</h3>
            <div className="space-y-6">
              {branches.map((branch) => (
                <div key={branch.name}>
                  <h4 className="font-bold text-white mb-2">{branch.name}</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-white/60 text-sm">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-[#4db8e8]" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Phone size={14} className="shrink-0 text-[#4db8e8]" />
                      <span dir="ltr">{branch.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-white/60 text-sm">
                      <Clock size={14} className="mt-0.5 shrink-0 text-[#4db8e8]" />
                      <span>{branch.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-[#4db8e8]">מידע</h3>
            <ul className="space-y-3">
              {[
                { href: "/shipping", label: "מדיניות משלוחים" },
                { href: "/returns", label: "החזרות והחלפות" },
                { href: "/warranty", label: "אחריות" },
                { href: "/privacy", label: "מדיניות פרטיות" },
                { href: "/terms", label: "תנאי שימוש" },
                { href: "/account", label: "האזור האישי" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#4db8e8] transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 py-6">
        <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Bilu Bikes. כל הזכויות שמורות.
          </p>
          <p className="text-white/40 text-sm flex items-center gap-2">
            <span>תשלום מאובטח</span>
            <span>•</span>
            <span>Tranzila</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
