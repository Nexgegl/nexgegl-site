"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../../constants/navigation";
import { NexgeglLogo } from "./Logo";
import { Button } from "./ui";
import Link from "next/link";
import { Dictionary } from "../../../dictionaries/types";

export default function Navbar({
  lang,
  dict,
}: {
  lang: "en" | "ar";
  dict: Dictionary;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // 👈 الجديد

  const isRTL = lang === "ar";
  const switchLang = isRTL ? "en" : "ar";

  /* ===== Scroll behavior (زي ما هو) ===== */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ===== Delay Navbar appearance ===== */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600); // ⏱️ نفس توقيت دخول محتوى الهيرو تقريبًا

    return () => clearTimeout(timer);
  }, []);

  return (
    <nav
      className={`
        fixed w-full z-50
        transition-all duration-700 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}
        ${
          isScrolled
            ? "bg-navy-900/90 backdrop-blur-md shadow-lg py-7"
            : "bg-transparent py-8"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="shrink-0"
        >
          <NexgeglLogo />
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="
                text-md font-semibold text-gray-300
                hover:text-gold-400
                uppercase tracking-[0.15em]
                transition-colors
              "
            >
              {dict.Landing.nav[link.key]}
            </a>
          ))}

          {/* Language Switch */}
          <button
            onClick={() => (window.location.href = `/${switchLang}`)}
            className="
              px-3 py-1.5
              rounded-md
              text-xs font-semibold tracking-widest
              border border-white/20
              text-white/80
              hover:border-gold-400
            "
          >
            {dict.Landing.common.switchTo}
          </button>

          {/* Login */}
       
            <Button variant="primary">{dict.Landing.common.login}</Button>
     
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-3">
          <Link
            href={`/${switchLang}`}
            className="
              px-3 py-1.5
              rounded-md
              text-xs font-semibold tracking-widest
              border border-white/20
              text-white/80
              hover:border-gold-400
            "
          >
            {dict.Landing.common.switchTo}
          </Link>

          <button className="text-white" onClick={() => setIsOpen((p) => !p)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-navy-950 px-6 py-6 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => setIsOpen(false)}
              className="text-lg text-gray-200 hover:text-gold-400"
            >
              {dict.Landing.nav[link.key]}
            </a>
          ))}

         
            <Button variant="primary">{dict.Landing.common.login}</Button>
     
        </div>
      )}
    </nav>
  );
}
