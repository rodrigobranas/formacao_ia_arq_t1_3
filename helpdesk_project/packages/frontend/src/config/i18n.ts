import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/ptBR";
import en from "./locales/en";

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
  },
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
