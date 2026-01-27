import { Users, Eye, Database, ShieldCheck, Zap } from "lucide-react";
import { IconType } from "../dictionaries/types";

export const VALUES_DATA = [
  { key: "human", icon: Users as IconType },
  { key: "clarity", icon: Eye as IconType },
  { key: "data", icon: Database as IconType },
  { key: "security", icon: ShieldCheck as IconType },
  { key: "simplicity", icon: Zap as IconType },
] as const;
