"use client";

import { useState, useEffect } from "react";
import { translations, type Lang, type Translations } from "./index";

export function useLang(): { lang: Lang; t: Translations } {
  const [lang, setLang] = useState<Lang>("tr");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;)\s*lang=([^;]+)/);
    if (match && (match[1] === "tr" || match[1] === "en")) {
      setLang(match[1] as Lang);
    }
  }, []);

  return { lang, t: translations[lang] };
}
