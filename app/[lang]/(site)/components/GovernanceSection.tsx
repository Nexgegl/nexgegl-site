"use client";

import { motion } from "framer-motion";
import { Section, SectionLabel } from "./ui";
import { TechImageFrame } from "./VisualComponents";
import {
  GOVERNANCE_FEATURES,
  GOVERNANCE_MEDIA,
} from "../../../constants/governance";
import { Shield } from "lucide-react";
import { Dictionary } from "../../../dictionaries/types";
import { fadeUp, staggerContainer } from "../lib/motion";

export default function GovernanceSection({ dict }: { dict: Dictionary }) {
  const content = dict.Landing.governance;

  return (
    <Section
      id="governance"
      darker
      className="border-t border-navy-800"
      pattern="hex"
    >
      <div className="flex flex-col lg:flex-row items-center gap-20 relative z-10">
        {/* Left  */}
        <motion.div
          className="lg:w-1/2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <motion.div variants={fadeUp}>
            <SectionLabel text={content.label} />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-4xl font-bold text-white mb-6"
          >
            {content.title}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-lg text-gray-300 mb-10 leading-relaxed font-light text-justify"
          >
            {content.description}
          </motion.p>

          <motion.div className="grid gap-6" variants={staggerContainer}>
            {GOVERNANCE_FEATURES.map((feat) => {
              const item = content.features[feat.key];

              return (
                <motion.div
                  key={feat.key}
                  variants={fadeUp}
                  className="flex items-start gap-6 p-6 rounded bg-navy-900/90 backdrop-blur
                             border border-navy-800 hover:border-gold-500/30
                             hover:bg-navy-800/50 transition-all duration-300"
                >
                  <div className="mt-1">
                    <feat.icon className="text-gold-500 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Right  */}
        <motion.div
          className="lg:w-1/2 relative min-h-[600px] flex items-center justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <div className="absolute inset-0 bg-gold-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative w-full h-[500px]">
            <TechImageFrame
              src={GOVERNANCE_MEDIA.image}
              alt="Secure Architecture"
              className="w-full h-full shadow-2xl opacity-90"
              overlayText={content.overlay}
              stat={content.stat}
              statLabel={content.statLabel}
            />

            {/* Badge */}
            <motion.div
              variants={fadeUp}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                         bg-navy-950/90 p-8 rounded border border-gold-500/50
                         backdrop-blur shadow-2xl text-center"
            >
              <Shield className="w-16 h-16 text-gold-500 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white">
                {content.badge.title}
              </div>
              <div className="text-xs text-gold-400 uppercase tracking-widest mt-2">
                {content.badge.subtitle}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
