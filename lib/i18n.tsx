import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = "ne" | "en";

type LocaleContextValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  pick: (ne: string, en: string) => string;
  digits: (value: string | number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const NEPALI_DIGITS: Record<string, string> = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
  "5": "५", "6": "६", "7": "७", "8": "८", "9": "९",
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>("ne");

  const value = useMemo<LocaleContextValue>(
    () => ({
      lang,
      setLang,
      pick: (ne, en) => (lang === "ne" ? ne : en),
      digits: (v) =>
        lang === "ne"
          ? String(v).replace(/[0-9]/g, (d) => NEPALI_DIGITS[d] ?? d)
          : String(v),
    }),
    [lang],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return { ...ctx, lang: ctx.lang };
}
