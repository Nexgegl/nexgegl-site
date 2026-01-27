import en from "./en";
import ar from "./ar";
import { Dictionary } from "./types";

export const dictionaries: Record<"en" | "ar", Dictionary> = {
  en,
  ar,
};

export type Lang = keyof typeof dictionaries;
