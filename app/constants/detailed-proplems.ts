import { Layers, TrendingUp, AlertTriangle } from "lucide-react";
import { IconType } from "../dictionaries/types";

export const DETAILED_PROBLEMS = [
  {
    key: "silos",
    icon: Layers as IconType,
    image:
      "/images/Saudi-business-landscape.webp",
    stat: "SILO",
  },
  {
    key: "gap",
    icon: TrendingUp as IconType,
    image:
      "/images/Strategy.webp",
    stat: "GAP",
  },
  {
    key: "fog",
    icon: AlertTriangle as IconType,
    image:
      "/images/Saudi-Vision.webp",
    stat: "FOG",
  },
] as const;
