"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      title={dark ? "Switch to light" : "Switch to dark"}
      className="ml-auto flex items-center justify-center w-9 h-9 rounded-lg text-ink3 hover:bg-elevated transition-colors text-lg"
    >
      {mounted ? (dark ? "☀️" : "🌙") : ""}
    </button>
  );
}
