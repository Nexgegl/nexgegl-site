import { use } from "react";
import Hero from "./components/Hero";
import AboutSection from "./components/AboutSection";
import VisionMissionSection from "./components/VisionMissionSection";
import ProblemsSection from "./components/ProblemsSection";
import SolutionsSection from "./components/SolutionsSection";
import CoreValuesSection from "./components/CoreValuesSection";
import GovernanceSection from "./components/GovernanceSection";
import ExperienceSection from "./components/ExperienceSection";

import { dictionaries } from "../../dictionaries";
import type { Lang } from "../../dictionaries";
import DecisionContractSection from "./components/DecisionContractSection";

type PageProps = {
  params: Promise<{ lang: Lang }>;
};

export default function LandingPage({ params }: PageProps) {
  const { lang } = use(params);
  const safeLang: Lang = lang === "ar" ? "ar" : "en";
  const dict = dictionaries[safeLang];

  return (
    <main>
      <Hero lang={safeLang} dict={dict} />
      <DecisionContractSection lang={safeLang} dict={dict} />
      <AboutSection dict={dict} />
      <VisionMissionSection dict={dict} />
      <ProblemsSection dict={dict} />
      <SolutionsSection dict={dict} />
      <CoreValuesSection dict={dict} />
      <GovernanceSection dict={dict} />
      <ExperienceSection dict={dict} />
    </main>
  );
}
