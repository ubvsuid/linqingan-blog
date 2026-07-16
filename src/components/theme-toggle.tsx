"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "linqingan-theme-change";

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(callback: () => void): () => void {
  const handleChange = () => callback();

  window.addEventListener(THEME_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function ThemeToggle() {
  const currentTheme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  const nextThemeLabel = nextTheme === "dark" ? "深色" : "浅色";

  function toggleTheme(): void {
    const root = document.documentElement;

    root.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`切换到${nextThemeLabel}模式`}
      aria-pressed={currentTheme === "dark"}
      title={`切换到${nextThemeLabel}模式`}
    >
      <span aria-hidden="true">◐</span>
    </button>
  );
}
