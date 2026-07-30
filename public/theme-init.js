(function () {
  try {
    var saved = localStorage.getItem("theme");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme =
      saved === "dark" || (!saved && systemDark) ? "dark" : "light";
  } catch {}
})();
