import { Globe, Brain, BarChart3, ShieldCheck } from "lucide-react";
import { IconType } from "../dictionaries/types";

export const DETAILED_SOLUTIONS = [
  {
    key: "commandCenter",
    icon: Globe as IconType,
    image:
      "/images/Digital.webp",
  },
  {
    key: "kfs",
    icon: Brain as IconType,
    image:
      "/images/Digital-2.webp",
  },
  {
    key: "alignment",
    icon: BarChart3 as IconType,
    image:
      "/images/Digital-3.webp",
  },
] as const;
