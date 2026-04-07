import { MapPin, Phone, Clock, Navigation } from "lucide-react";

const branches = [
  {
    name: "סניף ראש העין",
    address: "שילה 90, ראש העין",
    phone: "050-0000000",
    hours: [
      "ראשון–חמישי: 10:00–19:00",
      "שישי: 09:00–14:00",
      "שבת: סגור",
    ],
    mapUrl: "https://maps.google.com/?q=שילה+90+ראש+העין",
    color: "#4db8e8",
  },
  {
    name: "סניף כפר עציון",
    address: "מתחם חצר הכפר, כפר עציון",
    phone: "050-0000001",
    hours: [
      "ראשון–חמישי: 10:00–19:00",
      "שישי: 09:00–14:00",
      "שבת: סגור",
    ],
    mapUrl: "https://maps.google.com/?q=חצר+הכפר+כפר+עציון",
    color: "#1e5fa8",
  },
];

export default function BranchesSection() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="text-[#4db8e8] font-bold text-sm uppercase tracking-widest mb-3 block">
            הסניפים שלנו
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#1a2744] mb-4">
            תמצא אותנו קרוב אליך
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            שני סניפים מאובזרים ומלאי סחורה לשירותך.
            איסוף עצמי חינם מכל סניף.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 card-hover"
            >
              {/* Color bar */}
              <div
                className="h-2"
                style={{ backgroundColor: branch.color }}
              />

              <div className="p-8">
                <h3 className="text-2xl font-black text-[#1a2744] mb-6">
                  {branch.name}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${branch.color}20` }}
                    >
                      <MapPin size={18} style={{ color: branch.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{branch.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${branch.color}20` }}
                    >
                      <Phone size={18} style={{ color: branch.color }} />
                    </div>
                    <p className="font-semibold text-gray-700" dir="ltr">
                      {branch.phone}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${branch.color}20` }}
                    >
                      <Clock size={18} style={{ color: branch.color }} />
                    </div>
                    <div className="space-y-1">
                      {branch.hours.map((h) => (
                        <p key={h} className="text-gray-600 text-sm">
                          {h}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      backgroundColor: branch.color,
                      color: "white",
                    }}
                  >
                    <Navigation size={16} />
                    נווט לכאן
                  </a>
                  <a
                    href={`tel:${branch.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-gray-50"
                    style={{ borderColor: branch.color, color: branch.color }}
                  >
                    <Phone size={16} />
                    התקשר
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pickup note */}
        <div className="mt-10 text-center p-6 bg-[#1a2744] rounded-2xl text-white max-w-2xl mx-auto">
          <p className="text-lg font-bold mb-1">
            🛍️ איסוף עצמי — חינם תמיד
          </p>
          <p className="text-white/60">
            הזמן אונליין ואסוף מהסניף שנוח לך. ללא דמי משלוח.
          </p>
        </div>
      </div>
    </section>
  );
}
