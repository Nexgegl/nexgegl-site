"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "./ui";
import { LogoCore } from "./VisualComponents";
import { HERO_TAG_KEYS } from "../../../constants/hero-tages";
import { Dictionary } from "../../../dictionaries/types";

export default function Hero({
  lang,
  dict,
}: {
  lang: "en" | "ar";
  dict: Dictionary;
}) {
  const [heroReady, setHeroReady] = useState(false);

  /* ================= Scroll → CSS Variable ================= */
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.style.setProperty(
        "--scrollY",
        `${window.scrollY}px`
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ================= Preload Hero Background ================= */
  useEffect(() => {
    const img = new window.Image();
    img.src = "/images/hero.webp";
    img.onload = () => setHeroReady(true);
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{
        backgroundImage: "url('/images/hero.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ================= Overlay & Gradients ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none">
       
        {/* Side Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/70 via-navy-900/60 to-navy-900/50" />
        <div className="absolute inset-0 bg-gradient-to-l from-navy-950/50 via-navy-900/40 to-transparent" />
      </div>


      {/* ================= Content ================= */}
      <div
        className={`
          relative z-10 min-h-screen flex items-center
          transition-all duration-700
          ${heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
      >
        <div
          className="w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center"
          style={{
            transform: "translateY(calc(var(--scrollY) * -0.05))",
          }}
        >
          {/* ================= Left Column ================= */}
          <div className="order-2 lg:order-1 text-start">
            {/* Branding */}
            <div className="mb-6 flex items-center gap-3 opacity-0 animate-fade-in-up">
              <div className="w-12 h-[1px] bg-gold-500" />
              <span className="text-gold-500 font-bold uppercase tracking-[0.2em] text-md">
                {dict.Landing.hero.branding}
              </span>
            </div>

            {/* Titles */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6 drop-shadow-2xl">
             
              <span className="block text-gradient-gold delay-200">
                {dict.Landing.hero.title.line2}
              </span>
             
            </h1>

            {/* Description */}
            <div className="opacity-0 animate-fade-in-up delay-500 space-y-4 mb-10">
              <p className="text-lg text-gray-100 max-w-xl leading-relaxed font-semibold">
                {dict.Landing.hero.description.main}
              </p>
              <p className="text-sm text-gray-300 max-w-lg leading-relaxed font-semibold">
                {dict.Landing.hero.description.sub}
              </p>
            </div>

            {/* Protocol Tags */}
            <div className="flex flex-wrap gap-4 mb-10 opacity-0 animate-fade-in-up delay-500">
              {(["kill", "fix", "scale"] as const).map((key) => (
                <span
                  key={key}
                  className="px-4 py-2 bg-navy-900/70 border border-gold-500/40 rounded text-gold-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                  <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
                  {dict.Landing.hero.protocols[key]}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4 opacity-0 animate-fade-in-up delay-700">
              <a
                href="mailto:info@nexgegl.com?subject=Request%20a%20Trial%20-%20NEXGEGL"
                aria-label="Request a Trial"
              >
                <Button className="w-fit flex gap-2 group relative overflow-hidden">
                  {dict.Landing.hero.buttons.enter}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>

              <p className="text-md text-muted-foreground">
                {dict.Landing.hero.buttons.privacy}
              </p>
            </div>
          </div>

          {/* ================= Right Column ================= */}
          <div className="hidden md:flex order-1 lg:order-2 justify-center lg:justify-end relative">
            <LogoCore />

            <div className="absolute inset-0 pointer-events-none">
              {HERO_TAG_KEYS.map((key, i) => {
                const positions = [
                  "top-0 left-10",
                  "top-20 right-0",
                  "bottom-20 left-0",
                  "bottom-0 right-10",
                  "top-1/2 -right-10",
                ];

                return (
                  <div key={key} className={`absolute ${positions[i]}`}>
                    <div
                      className="animate-float"
                      style={{
                        animationDelay: `${i * 1.5}s`,
                        animationDuration: "5s",
                      }}
                    >
                      <span className="text-[10px] font-mono text-gold-300 bg-navy-900/80 border border-gold-500/40 px-3 py-1 rounded backdrop-blur-md shadow-lg">
                        {dict.Landing.hero.tags[key]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= Scroll Indicator ================= */}
      <div className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-70 animate-bounce-slow">
        <span className="text-[10px] text-gray-300 uppercase tracking-widest">
          {dict.Landing.hero.scroll}
        </span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-gold-500 to-transparent" />
      </div>
    </section>
  );
}

