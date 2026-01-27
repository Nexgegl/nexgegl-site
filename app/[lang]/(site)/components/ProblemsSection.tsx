"use client";

import { motion, easeOut } from "framer-motion";
import { Section, SectionHeader } from "./ui";
import { TechImageFrame } from "./VisualComponents";
import { DETAILED_PROBLEMS } from "../../../constants/detailed-proplems";
import { Dictionary } from "../../../dictionaries/types";

const slideLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: easeOut },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: easeOut },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

export default function ProblemsSection({ dict }: { dict: Dictionary }) {
  return (
    <Section id="problems">
      <SectionHeader
        label={dict.Landing.problems.header.label}
        title={dict.Landing.problems.header.title}
        subtitle={dict.Landing.problems.header.subtitle}
      />

      <div className="flex flex-col gap-32 relative z-10 mt-16">
        {DETAILED_PROBLEMS.map((prob, idx) => {
          const isReversed = idx % 2 === 1;
          const content = dict.Landing.problems.items[prob.key];
          const rowVariant = isReversed ? slideRight : slideLeft;

          return (
            <motion.div
              key={prob.key}
              className={`flex flex-col ${
                isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-16`}
              variants={rowVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {/*  Visual  */}
              <motion.div
                className="w-full lg:w-1/2 relative group"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TechImageFrame
                  src={prob.image}
                  alt={content.title}
                  className="w-full h-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  overlayText={dict.Landing.problems.overlay}
                  stat={prob.stat}
                  statLabel={content.statLabel}
                  color="gold"
                />

                {/* Index number */}
                <motion.div
                  className="absolute -top-10 -left-10 text-[120px] font-black text-white/5 pointer-events-none select-none z-0"
                  variants={fadeUp}
                >
                  0{idx + 1}
                </motion.div>
              </motion.div>

              {/* Text */}
              <motion.div className="w-full lg:w-1/2" variants={fadeUp}>
                <motion.div
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-navy-800 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-8"
                  variants={fadeUp}
                >
                  <prob.icon size={16} />
                  <span>
                    {dict.Landing.problems.painPoint} 0{idx + 1}
                  </span>
                </motion.div>

                <h3 className="text-3xl font-bold text-white mb-4 leading-tight">
                  {content.title}
                </h3>

                <h4 className="text-xl text-gold-500/80 mb-8 font-medium">
                  {content.subtitle}
                </h4>

                <p className="text-gray-300 leading-relaxed text-lg mb-8 border-l-2 border-navy-700 pl-8 text-justify">
                  {content.description}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
