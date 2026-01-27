import { Briefcase, Megaphone, Smartphone, Truck } from "lucide-react";
import { IconType } from "../dictionaries/types";

export const EXPERIENCE_ITEMS = [
  {
    key: "sales",
    icon: Briefcase as IconType,
    image:
      "/images/Sales&Distribution.webp",
  },
  {
    key: "brand",
    icon: Megaphone as IconType,
    image:
      "/images/Management.webp",
  },
  {
    key: "digital",
    icon: Smartphone as IconType,
    image:
      "/images/digital1.webp",
  },
  {
    key: "supply",
    icon: Truck as IconType,
    image:
      "/images/supply.webp",
  },
] as const;
