"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, X, Search } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CartDrawer from "@/components/cart/CartDrawer";

const navLinks = [
  { href: "/products", label: "כל המוצרים" },
  { href: "/categories/אופניים", label: "אופניים" },
  { href: "/categories/קסדות", label: "קסדות" },
  { href: "/categories/אביזרים", label: "אביזרים" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#1a2744] shadow-2xl py-2"
            : "bg-[#1a2744]/95 backdrop-blur-sm py-4"
        }`}
      >
        <div className="container-custom flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl font-black tracking-tight text-white">
              BILU<span className="text-[#4db8e8]">BIKES</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-[#4db8e8] font-semibold text-sm transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-[#4db8e8] transition-all duration-200 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Link
              href="/products"
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="חיפוש"
            >
              <Search size={20} />
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="עגלת קניות"
            >
              <ShoppingCart size={20} />
              {totalItems() > 0 && (
                <span className="absolute -top-1 -left-1 bg-[#4db8e8] text-[#1a2744] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="חשבון"
            >
              <User size={20} />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="תפריט"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#1a2744] border-t border-white/10 py-4">
            <div className="container-custom flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white/80 hover:text-[#4db8e8] font-semibold py-3 px-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-white/10 flex gap-4">
                <Link
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white/70 hover:text-white flex items-center gap-2 font-semibold"
                >
                  <User size={18} />
                  החשבון שלי
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
