"use client";

import React, { ReactNode } from "react";
import { TechPattern } from "./VisualComponents";

/* ----------------------------------------
    BUTTON
---------------------------------------- */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...props
}) => {
  const baseStyle =
    "px-5 py-3 rounded-sm font-semibold tracking-wide transition-all duration-300 text-sm uppercase hover:-translate-y-0.5";

  const variants = {
    primary:
      "bg-gold-500 text-navy-900 hover:bg-gold-400 hover:shadow-[0_0_15px_rgba(213,199,163,0.4)]",
    outline: "border border-gold-400 text-gold-400 hover:bg-gold-400/10",
    ghost: "text-gray-300 hover:text-white",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* ----------------------------------------
    SECTION WRAPPER
---------------------------------------- */
interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  darker?: boolean;
  pattern?: "circuit" | "neural" | "hex" | "grid" | "logo-repeat";
}

export const Section: React.FC<SectionProps> = ({
  id,
  className = "",
  children,
  darker = false,
  pattern,
}) => {
  return (
    <section
      id={id}
      className={`relative py-24 lg:py-32 overflow-hidden ${
        darker ? "bg-navy-950" : "bg-navy-900"
      } ${className}`}
    >
      {pattern && <TechPattern variant={pattern} />}

      {/* noise layer */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10 px-6">{children}</div>
    </section>
  );
};

/* ----------------------------------------
    CARD
---------------------------------------- */
interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = true,
}) => {
  return (
    <div
      className={`glass-panel p-5 rounded-sm border-t border-navy-700/50 ${
        hoverEffect
          ? "hover:border-gold-500/50 hover:shadow-[0_4px_30px_rgba(44,44,84,0.5)] transition-all duration-500"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

/* ----------------------------------------
    LABEL
---------------------------------------- */
export const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-12 h-[1px] bg-gold-500"></div>
    <span className="text-gold-500 font-bold uppercase tracking-[0.2em] text-xs">
      {text}
    </span>
  </div>
);

/* ----------------------------------------
    HEADER
---------------------------------------- */
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  label?: string;
}> = ({ title, subtitle, align = "center", label }) => (
  <div className={`mb-20 ${align === "center" ? "text-center" : "text-left"}`}>
    {label && align === "center" && (
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-12 h-[1px] bg-gold-500"></div>
        <span className="text-gold-500 font-bold uppercase tracking-[0.2em] text-xs">
          {label}
        </span>
        <div className="w-12 h-[1px] bg-gold-500"></div>
      </div>
    )}

    {label && align === "left" && <SectionLabel text={label} />}

    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
      {title}
    </h2>

    {subtitle && (
      <p className="text-gray-400 text-center! text-lg leading-relaxed font-light ">
        {subtitle}
      </p>
    )}
  </div>
);
