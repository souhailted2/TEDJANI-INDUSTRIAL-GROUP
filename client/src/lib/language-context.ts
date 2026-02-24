import { createContext, useContext } from "react";
import type { Language } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "ar",
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}
