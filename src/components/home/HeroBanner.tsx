"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

export default function HeroBanner() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrolled = window.scrollY;
      heroRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden flex items-center">
      {/* Background */}
      <div
        ref={heroRef}
        className="absolute inset-0 bg-navy-gradient"
        style={{ willChange: "transform" }}
      >
        {/* Geometric shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div
            className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-[#1e5fa8]/30 rounded-full blur-3xl"
            style={{ transform: "skewX(-15deg)" }}
          />
          <div
            className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[80%] bg-[#4db8e8]/10 rounded-full blur-2xl"
          />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(77,184,232,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(77,184,232,0.8) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-[#4db8e8]/20 border border-[#4db8e8]/40 rounded-full px-4 py-2 mb-8"
            style={{ animation: "fadeInUp 0.6s ease forwards" }}
          >
            <div className="w-2 h-2 bg-[#4db8e8] rounded-full animate-pulse" />
            <span className="text-[#4db8e8] font-bold text-sm">
              היבואן הרשמי של RL בישראל
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-none mb-6"
            style={{ animation: "fadeInUp 0.7s ease 0.1s forwards", opacity: 0 }}
          >
            רוכבים
            <br />
            <span className="text-[#4db8e8]">קדימה.</span>
          </h1>

          <p
            className="text-xl sm:text-2xl text-white/70 font-medium mb-10 leading-relaxed"
            style={{ animation: "fadeInUp 0.7s ease 0.2s forwards", opacity: 0 }}
          >
            מעל 10 שנות ניסיון.
            <br />
            האופניים, הציוד והאנשים שיעשו את ההבדל.
          </p>

          <div
            className="flex flex-wrap gap-4"
            style={{ animation: "fadeInUp 0.7s ease 0.3s forwards", opacity: 0 }}
          >
            <Link href="/products" className="btn-primary text-lg px-8 py-4">
              לקנייה עכשיו
              <ArrowLeft size={20} />
            </Link>
            <Link href="/categories/אופניים" className="btn-outline text-lg px-8 py-4">
              אופניים RL
            </Link>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap gap-8 mt-16"
            style={{ animation: "fadeInUp 0.7s ease 0.4s forwards", opacity: 0 }}
          >
            {[
              { num: "10+", label: "שנות ניסיון" },
              { num: "500+", label: "מוצרים" },
              { num: "2", label: "סניפים" },
              { num: "∞", label: "אחריות שירות" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-[#4db8e8]">{stat.num}</div>
                <div className="text-white/50 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs font-medium">גלול למטה</span>
        <ChevronDown size={20} className="animate-bounce" />
      </div>
    </section>
  );
}
