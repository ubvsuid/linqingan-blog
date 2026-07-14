"use client";

type Theme = "light" | "dark";

export function ThemeToggle() {
  function toggleTheme(): void {
    const root = document.documentElement;

    const currentTheme: Theme =
      root.dataset.theme === "dark" ? "dark" : "light";

    const nextTheme: Theme =
      currentTheme === "dark" ? "light" : "dark";

    root.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="切换浅色或深色模式"
      title="切换浅色或深色模式"
    >
      <span aria-hidden="true">◐</span>
    </button>
  );
}