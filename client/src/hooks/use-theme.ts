import { useEffect, useState } from "react";

type Theme = "default" | "purple";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ui-theme") as Theme) || "default";
    }
    return "default";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-purple");
    
    if (theme === "purple") {
      root.classList.add("theme-purple");
    }
    
    localStorage.setItem("ui-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "default" ? "purple" : "default"));
  };

  return { theme, toggleTheme };
}
