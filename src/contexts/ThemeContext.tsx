import React, { createContext, useContext, useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

type Theme = "green" | "blue" | "purple" | "orange";
type Mode = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeConfig = {
  green: { hue: 150, saturation: 60 },
  blue: { hue: 215, saturation: 65 },
  purple: { hue: 270, saturation: 60 },
  orange: { hue: 25, saturation: 75 },
};

function getThemeFromHue(hue: number): Theme {
  const themes = Object.entries(themeConfig);
  const closest = themes.reduce((prev, curr) => {
    return Math.abs(curr[1].hue - hue) < Math.abs(prev[1].hue - hue) ? curr : prev;
  });
  return closest[0] as Theme;
}

function getInitialMode(): Mode {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme-mode") as Mode;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const [theme, setThemeState] = useState<Theme>("green");
  const [mode, setModeState] = useState<Mode>(getInitialMode);

  // Apply mode to document
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  // Sync theme with profile
  useEffect(() => {
    if (profile?.themeHue !== undefined) {
      const themeFromProfile = getThemeFromHue(profile.themeHue);
      setThemeState(themeFromProfile);
      
      const config = themeConfig[themeFromProfile];
      document.documentElement.style.setProperty("--theme-hue", config.hue.toString());
      document.documentElement.style.setProperty("--theme-saturation", `${config.saturation}%`);
      document.documentElement.setAttribute("data-theme", themeFromProfile);
    }
  }, [profile?.themeHue]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const config = themeConfig[newTheme];
    
    document.documentElement.style.setProperty("--theme-hue", config.hue.toString());
    document.documentElement.style.setProperty("--theme-saturation", `${config.saturation}%`);
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Save to profile
    if (profile) {
      updateProfile({ themeHue: config.hue });
    }
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
