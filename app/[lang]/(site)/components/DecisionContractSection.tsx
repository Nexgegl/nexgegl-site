"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Section, SectionLabel } from "./ui";
import { fadeUp, stagger } from "../lib/motion";
import { Dictionary } from "../../../dictionaries/types";

export default function DecisionContractSection({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: "ar" | "en";
}) {
  const content = dict.Landing.decisionContract;

  const imageSrc =
    lang === "ar"
      ? "/images/decision-contract-example-ar.webp"
      : "/images/decision-contract-example.webp";

  return (
    <Section id="decision-contract" className="overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={fadeUp}>
            <SectionLabel text={content.label} />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-2xl md:text-3xl font-bold mt-4"
          >
            {content.title}
          </motion.h2>

          <motion.div variants={fadeUp} className="mt-8 flex justify-center">
            <Image
              src={imageSrc}
              alt={
                lang === "ar"
                  ? "مثال عقد قرار (منقّح) — بدون بيانات حقيقية"
                  : "Redacted decision contract example — no real data"
              }
              width={900}
              height={520}
              className="rounded-xl shadow-lg"
            />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-gray-400 max-w-3xl mx-auto"
          >
            {content.description}
          </motion.p>
        </motion.div>
      </div>
    </Section>
  );
}
