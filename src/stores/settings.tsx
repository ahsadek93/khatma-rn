import { colorScheme, vars } from "nativewind";
import { createContext, useContext, useState, type ReactNode } from "react";
import { View } from "react-native";
import { defaultLanguage, i18n, type AppLanguage } from "../i18n";

colorScheme.set("dark");

const themeVariables = {
  light: {
    "--color-background": "#f2f3ef",
    "--color-foreground": "#111827",
    "--color-secondary-foreground": "#4b5563",
    "--color-primary": "#947018",
    "--color-surface": "#e8ebe6",
    "--color-subtle-border": "rgba(17, 24, 39, 0.1)",
    "--color-track": "rgba(17, 24, 39, 0.1)",
    "--color-tab-inactive": "#4b5563",
  },
  dark: {
    "--color-background": "#14271c",
    "--color-foreground": "#f7f8f3",
    "--color-secondary-foreground": "#b8c7bc",
    "--color-primary": "#d4af37",
    "--color-surface": "rgba(255, 255, 255, 0.05)",
    "--color-subtle-border": "rgba(247, 248, 243, 0.1)",
    "--color-track": "rgba(255, 255, 255, 0.1)",
    "--color-tab-inactive": "#f7f8f3",
  },
} as const;

type Settings = {
  theme: "dark" | "light";
  language: AppLanguage;
  setTheme: (theme: "dark" | "light") => void;
  setLanguage: (language: AppLanguage) => void;
};

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Settings["theme"]>("dark");
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);
  const updateTheme = (value: Settings["theme"]) => {
    colorScheme.set(value);
    setTheme(value);
  };
  const updateLanguage = (value: AppLanguage) => {
    i18n.locale = value;
    setLanguage(value);
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        setTheme: updateTheme,
        setLanguage: updateLanguage,
      }}
    >
      <View
        className="flex-1 bg-background"
        style={vars(themeVariables[theme])}
      >
        {children}
      </View>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const settings = useContext(SettingsContext);
  if (!settings)
    throw new Error("useSettings must be used within SettingsProvider");
  return settings;
}
