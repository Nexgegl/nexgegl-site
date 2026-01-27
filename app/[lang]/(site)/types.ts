import { LucideIcon } from "lucide-react";

export interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ProblemProp {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  id: string;
}
