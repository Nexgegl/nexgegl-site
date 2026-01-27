"use client";

import { motion } from "framer-motion";
import { Section, SectionLabel } from "./ui";
import { NexgeglLogo } from "./Logo";
import { EXPERIENCE_ITEMS } from "../../../constants/experience";
import { Dictionary } from "../../../dictionaries/types";
import { fadeUp, stagger } from "../lib/motion";

export default function ExperienceSection({ dict }: { dict: Dictionary }) {
  const content = dict.Landing.experience;

  return (
    <Section id="experience" darker className="overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 opacity-[0.02] pointer-events-none">
        <NexgeglLogo iconOnly className="w-[1000px] h-[1000px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col xl:flex-row gap-16">
          {/*  Left  */}
          <motion.div
            className="xl:w-1/3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
          >
            <motion.div variants={fadeUp}>
              <SectionLabel text={content.label} />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
            >
              {content.title}
            </motion.h2>

            <motion.div
              variants={fadeUp}
              className="flex items-baseline gap-2 mb-8 border-b border-navy-800 pb-8"
            >
              <span className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 drop-shadow-2xl">
                {content.years}
              </span>
              <div className="flex flex-col">
                <span className="text-5xl font-bold text-gold-500">+</span>
                <span className="text-sm text-gray-400 uppercase tracking-widest">
                  {content.yearsLabel}
                </span>
              </div>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-gray-400 text-lg leading-relaxed text-justify"
            >
              {content.desc}
            </motion.p>
          </motion.div>

          {/* Right */}
          <motion.div
            className="xl:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {EXPERIENCE_ITEMS.map((item) => {
              const itemContent = content.items[item.key];

              return (
                <motion.div
                  key={item.key}
                  variants={fadeUp}
                  className="group relative h-80 rounded-sm overflow-hidden border border-navy-700 hover:border-gold-500 transition-colors duration-500"
                >
                  {/* Image */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={item.image}
                      alt={itemContent.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/80 to-navy-900/40 group-hover:via-navy-900/60 transition-colors duration-500" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end">
                    <div className="absolute top-8 right-8 w-14 h-14 rounded bg-navy-950/80 backdrop-blur border border-navy-600 flex items-center justify-center text-gold-500 shadow-xl group-hover:scale-110 group-hover:border-gold-500/50 transition-all duration-300">
                      <item.icon size={28} />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gold-300 transition-colors">
                      {itemContent.title}
                    </h3>

                    <div className="h-[1px] w-full bg-navy-600 mb-4 group-hover:bg-gold-500/50 transition-colors" />
                    <p className="text-sm text-gray-300 leading-relaxed opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      {itemContent.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
