"use client";

import { motion } from "framer-motion";
import { Section } from "./ui";
import { VISION_MISSION_CONTENT } from "../../../constants/vision-content";
import { Dictionary } from "../../../dictionaries/types";
import { fadeUp } from "../lib/motion";

export default function VisionMissionSection({ dict }: { dict: Dictionary }) {
  return (
    <Section
      id="vision"
      darker
      pattern="neural"
      className="border-t border-navy-800"
    >
      <motion.div
        className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-lg border border-navy-700"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-120px" }}
      >
        {/* ================= Vision ================= */}
        <motion.div
          className="relative min-h-[420px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${VISION_MISSION_CONTENT.visionImage})`,
          }}
          variants={fadeUp}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950/85 via-navy-900/70 to-navy-900/60" />

          {/* Content */}
          <div className="relative z-10 p-12 h-full flex flex-col justify-center">
            <motion.div
              className="w-16 h-1 bg-gold-500 mb-8"
              variants={fadeUp}
            />

            <motion.h3
              className="text-3xl font-bold text-white mb-6 uppercase tracking-wider"
              variants={fadeUp}
            >
              {dict.Landing.visionMission.vision.title}
            </motion.h3>

            <motion.p
              className="text-gray-300 leading-loose text-lg text-justify"
              variants={fadeUp}
            >
              {dict.Landing.visionMission.vision.text}
            </motion.p>
          </div>
        </motion.div>

        {/* ================= Mission ================= */}
        <motion.div
          className="relative min-h-[500px] bg-cover bg-center border-t lg:border-t-0 lg:border-l border-navy-700"
          style={{
            backgroundImage: `url(${VISION_MISSION_CONTENT.missionImage})`,
          }}
          variants={fadeUp}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950/85 via-navy-900/70 to-navy-900/60" />

          {/* Content */}
          <div className="relative z-10 p-12 h-full flex flex-col justify-center">
            <motion.div
              className="w-16 h-1 bg-gold-500 mb-8"
              variants={fadeUp}
            />

            <motion.h3
              className="text-3xl font-bold text-white mb-6 uppercase tracking-wider"
              variants={fadeUp}
            >
              {dict.Landing.visionMission.mission.title}
            </motion.h3>

            <motion.p
              className="text-gray-300 leading-loose text-lg text-justify"
              variants={fadeUp}
            >
              {dict.Landing.visionMission.mission.text}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </Section>
  );
}
