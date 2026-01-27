"use client";

import { motion } from "framer-motion";
import { ABOUT_CONTENT } from "../../../constants/about-content";
import { TechImageFrame, CommandCenterGraphic } from "./VisualComponents";
import { Section, SectionLabel } from "./ui";
import { Dictionary } from "../../../dictionaries/types";
import { fadeUp, stagger } from "../lib/motion";

export default function AboutSection({ dict }: { dict: Dictionary }) {
  return (
    <Section id="about" pattern="logo-repeat">
      <motion.div
        className="grid xl:grid-cols-2 gap-24 items-center"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-120px" }}
      >
        {/* Left: Content */}
        <motion.div className="flex flex-col justify-center" variants={fadeUp}>
          <SectionLabel text={dict.Landing.about.label} />

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            {dict.Landing.about.title}
          </h2>

          <p className="text-lg text-gray-300 mb-10 leading-relaxed font-light text-justify max-w-xl">
            {dict.Landing.about.description}
          </p>

          {/* Highlight Quote */}
          <motion.div
            className="relative bg-navy-800/60 border-l-4 border-gold-500 p-8 mb-12 rounded-r-lg backdrop-blur-sm shadow-xl"
            variants={fadeUp}
          >
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gold-500/20 rounded-full blur-md" />
            <p className="text-white italic text-lg font-light leading-relaxed">
              &ldquo;{dict.Landing.about.subtitle}&rdquo;

            </p>
          </motion.div>

          {/* Integrations */}
          <motion.div className="grid sm:grid-cols-2 gap-4" variants={stagger}>
            {ABOUT_CONTENT.integrations.map((item) => (
              <motion.div
                key={item.key}
                variants={fadeUp}
                className="group flex items-center gap-4 p-4 rounded bg-navy-950/80 border border-navy-800 hover:border-gold-500/40 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-colors shadow-lg">
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-bold text-gray-300 uppercase tracking-wide group-hover:text-white transition-colors">
                  {dict.Landing.about.integrations[item.key]}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/*  Right: Visual */}
        <motion.div
          className="relative min-h-[600px] flex items-center justify-center"
          variants={fadeUp}
        >
          <TechImageFrame
            src={ABOUT_CONTENT.image}
            alt={dict.Landing.about.imageAlt}
            className="w-full h-[520px] md:h-[620px] shadow-[0_30px_80px_rgba(0,0,0,0.6)] z-10"
            overlayText={dict.Landing.about.overlay.text}
            stat={dict.Landing.about?.overlay?.stat}
            statLabel={dict.Landing.about.overlay.statLabel}
          />

          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Floating Widget */}
          <motion.div
            className="absolute -bottom-14 -left-14 w-80 z-20 hidden lg:block"
            variants={fadeUp}
          >
            <CommandCenterGraphic />
          </motion.div>
        </motion.div>
      </motion.div>
    </Section>
  );
}
