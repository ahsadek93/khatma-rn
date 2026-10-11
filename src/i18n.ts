import { I18n } from "i18n-js";

export const translations = {
  ar: {
    welcome: "أهلًا بك!",
  },
  en: {
    welcome: "Welcome!",
  },
};

export type AppLanguage = keyof typeof translations;
export const defaultLanguage: AppLanguage = "ar";

export const i18n = new I18n(translations);
i18n.defaultLocale = defaultLanguage;
i18n.locale = defaultLanguage;
i18n.enableFallback = true;
