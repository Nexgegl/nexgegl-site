"use client";
import React from "react";
import {
  Globe,
  ArrowRight,
  Server,
  Smartphone,
  Target,
  Activity,
  Zap,
  Triangle,
  Shield,
  Cpu,
} from "lucide-react";
import { NexgeglLogo } from "./Logo";
import { useState } from "react";
import { useMemo } from "react";
import { StaticImageData } from "next/image";

// --- Tech Pattern Backgrounds ---
interface TechPatternProps {
  variant: "circuit" | "neural" | "hex" | "grid" | "logo-repeat";
  className?: string;
}

export const TechPattern: React.FC<TechPatternProps> = ({
  variant,
  className = "",
}) => {
  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${className}`}
    >
      {/* Circuit Pattern (Solutions) */}
      {variant === "circuit" && (
        <svg
          className="w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern
            id="circuit"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path d="M10 10h80v80h-80z" fill="none" />
            <path
              d="M20 20h60M20 50h60M20 80h60M50 20v60"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gold-500"
            />
            <circle
              cx="50"
              cy="50"
              r="2"
              fill="currentColor"
              className="text-gold-500"
            />
            <circle
              cx="20"
              cy="20"
              r="1"
              fill="currentColor"
              className="text-white"
            />
            <circle
              cx="80"
              cy="80"
              r="1"
              fill="currentColor"
              className="text-white"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      )}

      {/* Neural Network (Vision/AI) */}
      {variant === "neural" && (
        <svg
          className="w-full h-full opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern
            id="neural"
            x="0"
            y="0"
            width="150"
            height="150"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1.5" fill="white" />
            <circle cx="120" cy="40" r="1.5" fill="white" />
            <circle cx="70" cy="100" r="1.5" fill="white" />
            <path
              d="M20 20L120 40L70 100Z"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gold-500"
              fill="none"
              strokeDasharray="4 4"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#neural)" />
        </svg>
      )}

      {/* Hex Grid (Governance/Structure) */}
      {variant === "hex" && (
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.03' fill='%23d5c7a3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Perspective Grid (General/Hero) */}
      {variant === "grid" && (
        <div
          className="w-full h-full perspective-grid opacity-20"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          }}
        />
      )}

      {/* Logo Repeat Pattern (Branding) */}
      {variant === "logo-repeat" && (
        <div className="w-full h-full opacity-[0.02] flex flex-wrap content-center justify-center gap-20 p-20 transform -rotate-12 scale-150">
          {Array.from({ length: 20 }).map((_, i) => (
            <NexgeglLogo key={i} iconOnly className="w-32 h-32" />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Tech Image Frame (HUD Overlay) ---
interface TechImageFrameProps {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  overlayText?: string;
  stat?: string;
  statLabel?: string;
  color?: "gold" | "navy";
}

export const TechImageFrame: React.FC<TechImageFrameProps> = ({
  src,
  alt,
  className = "",
  overlayText = "LIVE FEED",
  stat,
  statLabel,
  color = "gold",
}) => {
  const [active, setActive] = useState(false);

  const borderColor = color === "gold" ? "border-gold-500" : "border-white";
  const textColor = color === "gold" ? "text-gold-400" : "text-white";
  const bgColor = color === "gold" ? "bg-gold-500" : "bg-white";

  return (
    <div
      className={`
        relative overflow-hidden rounded-sm border border-navy-700 bg-navy-950
        ${active ? "is-active" : ""}
        ${className}
      `}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {/* Base Image */}
     <img
      src={typeof src === "string" ? src : src.src}
      alt={alt}
      className={`
        w-full h-full object-cover
        opacity-70 scale-[1.04] grayscale
        transition-all duration-[1200ms] ease-out
        ${active && "opacity-100 scale-100 grayscale-0"}
      `}
    />


      {/* Dark Overlay */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-t from-navy-950 via-navy-900/40 to-transparent
          pointer-events-none
          transition-opacity duration-700
          group-hover:opacity-40
        "
      />

      {/* Noise + Grid */}
      <div
        className="
          absolute inset-0
          opacity-10
          transition-opacity duration-700
          group-hover:opacity-5
        "
      />
      <div
        className="absolute inset-0 border border-white/5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Scanning Line */}
      <div
        className={`
        absolute top-0 left-0 w-full h-[2px]
        ${bgColor}/30 blur-[2px]
        animate-scan
        transition-opacity duration-500
        group-hover:opacity-80
      `}
      />

      {/* Corners */}
      <div
        className={`absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 ${borderColor}/60`}
      />
      <div
        className={`absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 ${borderColor}/60`}
      />
      <div
        className={`absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 ${borderColor}/60`}
      />
      <div
        className={`absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 ${borderColor}/60`}
      />

      {/* HUD Header */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span
          className={`text-[10px] font-mono ${textColor} tracking-widest uppercase`}
        >
          {overlayText}
        </span>
      </div>

      {/* Stats */}
      {stat && (
        <div className="absolute bottom-6 right-6 text-right">
          <div className="text-4xl font-bold text-white font-mono leading-none tracking-tighter">
            {stat}
          </div>
          {statLabel && (
            <div
              className={`text-[10px] ${textColor} font-mono tracking-widest uppercase mt-1`}
            >
              {statLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CommandCenterGraphic = () => {
  /* generate once – no hydration issues */
  const bars = useMemo(() => [42, 58, 71], []);

  const barHeights = useMemo(
    () => [40, 65, 30, 80, 55, 90, 70, 45, 60, 75],
    []
  );

  return (
    <div className="relative w-full min-h-[300px] bg-navy-800/80 backdrop-blur-md rounded border border-navy-700/50 p-4 overflow-hidden shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-navy-700/50 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
        </div>
        <span className="text-[10px] font-mono text-gold-400/80 tracking-widest">
          NEXGEGL // SYSTEM_CORE_V2
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {/* Metrics */}
        <div className="space-y-3">
          {bars.map((w, i) => (
            <div
              key={i}
              className="bg-navy-900/60 p-2 rounded border border-navy-700/50"
            >
              <span className="text-[8px] text-gray-400 uppercase tracking-wider">
                Metric 0{i + 1}
              </span>

              <div className="h-1 bg-navy-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gold-500 transition-all duration-700"
                  style={{ width: `${w}%` }}
                />
              </div>
            </div>
          ))}

          {/* Globe */}
          <div className="relative bg-navy-900/60 p-2 rounded border border-navy-700/50 h-24 flex items-center justify-center">
            <Globe className="absolute w-12 h-12 text-blue-500/20 animate-spin-slow" />
            <span className="relative z-10 text-2xl font-bold text-white tracking-tighter">
              360°
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-2 bg-navy-900/60 rounded border border-navy-700/50 p-3 flex flex-col">
          <h4 className="text-[10px] font-bold text-white uppercase mb-4 tracking-widest">
            Operational View
          </h4>

          <div className="flex-1 flex items-end gap-1 px-1 pb-1">
            {barHeights.map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-navy-800 rounded-t-sm relative overflow-hidden"
              >
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-gold-600 to-gold-400 opacity-80 transition-all duration-700"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Solution Engine Graphic (For Solutions Section) ---
export const EngineGraphic: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Rotating Rings */}
      <div
        className="absolute w-64 h-64 rounded-full border border-navy-600 border-dashed animate-spin-slow opacity-30"
        style={{ animationDuration: "20s" }}
      />
      <div
        className="absolute w-48 h-48 rounded-full border border-gold-500/20 animate-spin-slow opacity-50"
        style={{ animationDirection: "reverse", animationDuration: "15s" }}
      />

      {/* Core Triangle */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2">
        <div className="w-20 h-20 bg-navy-800 border-2 border-gold-500 rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(181,156,92,0.4)]">
          <Zap className="text-gold-400 w-10 h-10 -rotate-45" />
        </div>
        <div className="mt-8 flex gap-8">
          <div className="text-center">
            <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">
              KILL
            </div>
            <div className="w-12 h-1 bg-red-500/50 mx-auto rounded-full" />
          </div>
          <div className="text-center">
            <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
              FIX
            </div>
            <div className="w-12 h-1 bg-blue-500/50 mx-auto rounded-full" />
          </div>
          <div className="text-center">
            <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1">
              SCALE
            </div>
            <div className="w-12 h-1 bg-green-500/50 mx-auto rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Hero Logo Core Animation ---

export const LogoCore = () => {
  return (
    <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
      {/* Outer Orbit Data Ring */}
      <div className="absolute w-[120%] h-[120%] rounded-full border border-navy-700/30 orbit-outer">
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute top-1/2 left-1/2 w-full h-[1px] bg-navy-800"
            style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
          />
        ))}
      </div>

      {/* Orbit 1 */}
      <div className="absolute w-full h-full rounded-full border border-gold-500/10 orbit-mid">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gold-400 rounded-full shadow-[0_0_10px_#b59c5c]" />
      </div>

      {/* Orbit 2 (reverse spin) */}
      <div className="absolute w-3/4 h-3/4 rounded-full border border-blue-950/90 border-dashed orbit-inner">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-500 rounded-full" />
      </div>

      {/* Glow */}
      <div className="absolute w-1/2 h-1/2 bg-gold-500/50 rounded-full blur-2xl animate-pulse" />

      {/* Center 3D Logo */}
      <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 bg-navy-950/80 backdrop-blur border border-gold-500/30 rounded-xl flex items-center justify-center shadow-[0_0_50px_rgba(181,156,92,0.15)] rotate-45 group hover:scale-110 transition-all duration-500">
        <div className="absolute inset-0 border border-gold-500/20 rounded-xl translate-x-2 translate-y-2" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #d5c7a3 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />

        <div className="-rotate-45">
          <NexgeglLogo className="h-5 w-auto" />
        </div>
      </div>
    </div>
  );
};

// --- Abstract Hero Data Visualization ---
export const HeroDataVis = () => {
  const streams = useState(() =>
    Array.from({ length: 6 }).map(() => ({
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
    }))
  )[0];

  const nodes = useState(() =>
    Array.from({ length: 8 }).map(() => ({
      top: Math.random() * 80 + 10,
      left: Math.random() * 80 + 10,
      duration: 1 + Math.random() * 3,
    }))
  )[0];

  return (
    <div className="absolute inset-0 bg-navy-950 overflow-hidden">
      {/* Streams */}
      <div className="absolute inset-0 z-0">
        {streams.map((s, i) => (
          <div
            key={i}
            className="absolute top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-gold-500/40 to-transparent animate-data-stream"
            style={{
              left: `${10 + i * 15}%`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Nodes */}
      {nodes.map((n, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gold-400 blur-[2px] animate-pulse"
          style={{
            top: `${n.top}%`,
            left: `${n.left}%`,
            animationDuration: `${n.duration}s`,
          }}
        />
      ))}
    </div>
  );
};
