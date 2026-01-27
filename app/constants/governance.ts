import { ShieldCheck, Server, Lock, Layers } from "lucide-react";
import { IconType } from "../dictionaries/types";

export const GOVERNANCE_MEDIA = {
  image:
    "/images/Governance.webp",
};

export const GOVERNANCE_FEATURES = [
  { key: "pdpl", icon: ShieldCheck as IconType },
  { key: "cloud", icon: Server as IconType },
  { key: "isolation", icon: Lock as IconType },
  { key: "zones", icon: Layers as IconType },
] as const;
