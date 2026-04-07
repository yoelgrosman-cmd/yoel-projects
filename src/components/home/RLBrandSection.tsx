import Link from "next/link";
import { ArrowLeft, Award, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "מותג פרמיום",
    desc: "RL היא מותג אופניים בינלאומי המוכר בכל העולם בזכות איכותו הגבוהה",
  },
  {
    icon: Shield,
    title: "יבואן רשמי",
    desc: "בילו בייקס הוא היבואן הרשמי הבלעדי של RL בישראל",
  },
  {
    icon: Zap,
    title: "טכנולוגיה מתקדמת",
    desc: "חומרים קלים ועמידים, עיצוב אירודינמי ורכיבים ברמה הגבוהה ביותר",
  },
];

export default function RLBrandSection() {
  return (
    <section className="section-padding bg-[#1a2744] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#1e5fa8]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#4db8e8]/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-3"
          style={{
            backgroundImage: `linear-gradient(rgba(77,184,232,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(77,184,232,0.15) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text side */}
          <div>
            <span className="text-[#4db8e8] font-bold text-sm uppercase tracking-widest mb-4 block">
              מותג בלעדי
            </span>
            <h2 className="text-5xl lg:text-6xl font-black mb-6 leading-none">
              היבואן הרשמי
              <br />
              של <span className="text-[#4db8e8]">RL</span> בישראל
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              בילו בייקס גאה להיות היבואן הבלעדי של מותג RL בישראל.
              RL מייצג ביצועים יוצאי דופן, עיצוב פורץ דרך ואיכות ללא פשרות.
              מאות מוצרים — אופניים, קסדות, ביגוד וציוד — זמינים אצלנו.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products?brand=RL"
                className="btn-primary"
              >
                כל מוצרי RL
                <ArrowLeft size={18} />
              </Link>
              <Link href="/about" className="btn-outline">
                אודותינו
              </Link>
            </div>
          </div>

          {/* Features side */}
          <div className="space-y-6">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#4db8e8]/20 flex items-center justify-center shrink-0">
                  <feat.icon size={22} className="text-[#4db8e8]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">{feat.title}</h3>
                  <p className="text-white/50 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
