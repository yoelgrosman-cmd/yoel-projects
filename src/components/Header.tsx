'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { CATEGORIES } from '@/lib/categories';

export default function Header() {
  const { totalItems, openCart } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = totalItems();

  return (
    <>
      {/* Top bar */}
      <div className="bg-blue-950 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1">📞 03-1234567</span>
            <span className="flex items-center gap-1">✉️ info@bilubikes.co.il</span>
          </div>
          <div className="flex gap-4">
            <span>משלוח חינם מעל ₪299</span>
            <span>|</span>
            <span>שעות פתיחה: א&apos;-ה&apos; 10:00-19:00</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-white border-b border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:bg-orange-500 transition-colors">
                BB
              </div>
              <div>
                <div className="text-xl font-black text-blue-900 leading-tight tracking-tight">
                  BILU BIKES
                </div>
                <div className="text-xs text-gray-500">חנות אופניים מקצועית</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                ראשי
              </Link>

              {/* Catalog dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsCatalogOpen(true)}
                onMouseLeave={() => setIsCatalogOpen(false)}
              >
                <button className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                  קטלוג
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCatalogOpen && (
                  <div className="absolute top-full right-0 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/catalog?category=${cat.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                        onClick={() => setIsCatalogOpen(false)}
                      >
                        <span className="text-2xl">
                          {cat.id === 'mountain' ? '⛰️' :
                           cat.id === 'road' ? '🚴' :
                           cat.id === 'electric' ? '⚡' :
                           cat.id === 'city' ? '🏙️' :
                           cat.id === 'kids' ? '👦' : '🔧'}
                        </span>
                        <div>
                          <div className="font-medium text-gray-800">{cat.name}</div>
                          <div className="text-xs text-gray-500">{cat.description}</div>
                        </div>
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                      <Link
                        href="/catalog"
                        className="flex items-center gap-2 text-blue-700 font-medium hover:text-blue-900 py-2"
                        onClick={() => setIsCatalogOpen(false)}
                      >
                        <span>כל המוצרים</span>
                        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/about"
                className="px-4 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                אודות
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                צור קשר
              </Link>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">עגלה</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -left-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <Link href="/" className="px-4 py-3 rounded-lg hover:bg-blue-50 font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>ראשי</Link>
              <Link href="/catalog" className="px-4 py-3 rounded-lg hover:bg-blue-50 font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>קטלוג מלא</Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?category=${cat.id}`}
                  className="px-8 py-2 rounded-lg hover:bg-blue-50 text-gray-600 text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/about" className="px-4 py-3 rounded-lg hover:bg-blue-50 font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>אודות</Link>
              <Link href="/contact" className="px-4 py-3 rounded-lg hover:bg-blue-50 font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>צור קשר</Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
