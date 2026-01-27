import { Users, Server, Network, Cpu } from "lucide-react";
import { IconType } from "../dictionaries/types";

export const ABOUT_CONTENT = {
  image: "/images/Digital2.webp",
  integrations: [
    { key: "erp", icon: Server as IconType },
    { key: "crm", icon: Users as IconType },
    { key: "logistics", icon: Network as IconType },
    { key: "ads", icon: Cpu as IconType },
  ],
};
