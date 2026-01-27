"use client";

import { motion, easeOut } from "framer-motion";
import { Section, SectionHeader } from "./ui";
import { CheckCircle } from "lucide-react";
import { DETAILED_SOLUTIONS } from "../../../constants/detailed-solutions";
import { Dictionary } from "../../../dictionaries/types";

const cardVariant = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: easeOut,
    },
  },
};

export default function SolutionsSection({ dict }: { dict: Dictionary }) {
  return (
    <Section
      id="solutions"
      darker
      className="border-t border-navy-800"
      pattern="circuit"
    >
      <SectionHeader
        label={dict.Landing.solutions.header.label}
        title={dict.Landing.solutions.header.title}
        subtitle={dict.Landing.solutions.header.subtitle}
      />

      <div className="grid lg:grid-cols-3 gap-8 mt-16 relative z-10">
        {DETAILED_SOLUTIONS.map((sol) => {
          const content = dict.Landing.solutions.items[sol.key];

          return (
            <motion.div
              key={sol.key}
              className="group relative bg-navy-900 border border-navy-700 rounded-sm overflow-hidden
                         hover:border-gold-500/50 transition-all duration-500
                         hover:-translate-y-2 hover:shadow-2xl"
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
            >
              {/*  Image  */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src={sol.image}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-700
                             group-hover:scale-110 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 to-transparent" />

                <div
                  className="absolute top-4 right-4 bg-navy-950/80 backdrop-blur
                             border border-gold-500/30 p-2 rounded text-gold-500"
                >
                  <sol.icon size={20} />
                </div>
              </div>

              {/* Content */}
              <div className="p-8 relative">
                <div className="text-4xl text-navy-800 font-bold absolute top-4 right-6 opacity-20">
                  {content.id}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {content.title}
                </h3>

                <p className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-6">
                  {content.subtitle}
                </p>

                <p
                  className="text-gray-400 text-sm leading-relaxed mb-8 text-justify
                             border-b border-navy-800 pb-8"
                >
                  {content.description}
                </p>

                {/* Features */}
                <ul className="space-y-3">
                  {content.features.map((feat: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 text-gold-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Highlight */}
              <div
                className="absolute bottom-0 left-0 w-full h-1 bg-gold-500
                           transform scale-x-0 group-hover:scale-x-100
                           transition-transform duration-500 origin-left"
              />
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
