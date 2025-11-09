import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("theme") || "dark") === "dark"
      : true
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((v) => !v)}
      className="px-3 py-1 rounded-full border dark:border-neutral-700 text-sm"
      title={dark ? "تیره" : "روشن"}
    >
      {dark ? "تیره 🌙" : "روشن ☀️"}
    </button>
  );
}
