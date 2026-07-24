"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { isEnglishPath } from "@/lib/i18n";

export function DocumentLanguage() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = isEnglishPath(pathname) ? "en" : "zh-CN";
  }, [pathname]);

  return null;
}
