"use client";

import { motion, type Variants } from "framer-motion";
import { Section, SectionHeader, Card } from "./ui";
import { VALUES_DATA } from "../../../constants/core-values";
import { Dictionary } from "../../../dictionaries/types";

const valueCardVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function CoreValuesSection({ dict }: { dict: Dictionary }) {
  return (
    <Section id="values" pattern="grid">
      <SectionHeader
        label={dict.Landing.values.header.label}
        title={dict.Landing.values.header.title}
        subtitle={dict.Landing.values.header.subtitle}
      />

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {VALUES_DATA.map((val) => {
          const content = dict.Landing.values.items[val.key];

          return (
            <motion.div
              key={val.key}
              variants={valueCardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
            >
              <Card className="flex flex-col items-start gap-4 p-5 min-h-[320px]">
                {/* Icon */}
                <div className="w-12 h-12 rounded bg-navy-800 border border-navy-700 flex items-center justify-center text-gold-500 shadow-lg">
                  <val.icon size={24} />
                </div>

                {/* Title */}
                <h4 className="text-lg font-bold text-white leading-tight">
                  {content.title}
                </h4>

                {/* Divider */}
                <div className="w-8 h-1 bg-gold-500/30 rounded-full" />

                {/* Description */}
               <p className="w-full text-md text-gray-400 leading-relaxed">
                  {content.description}
                </p>

              </Card>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
