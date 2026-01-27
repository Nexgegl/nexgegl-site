"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="
        fixed bottom-11 right-8 z-50
        w-12 h-12
        rounded-full
        bg-navy-900/90 backdrop-blur
        border border-gold-500/40
        text-gold-500
        flex items-center justify-center
        shadow-[0_0_20px_rgba(181,156,92,0.35)]
        hover:bg-gold-500 hover:text-navy-900
        hover:scale-110
        transition-all duration-300
      "
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
