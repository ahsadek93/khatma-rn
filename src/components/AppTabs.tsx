import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

const tabs = [
  { key: "quran", href: "/(app)/home", label: "tabQuran", icon: "\u25A4" },
  { key: "zikr", href: "/(app)/zikr", label: "tabZikr", icon: "\u2726" },
  {
    key: "settings",
    href: "/(app)/settings",
    label: "tabSettings",
    icon: "\u2699",
  },
] as const;

export function AppTabs({ active }: { active: (typeof tabs)[number]["key"] }) {
  return (
    <View className="flex-row border-t border-foreground/10 px-3 pb-5 pt-3">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link key={tab.key} href={tab.href} asChild>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className="flex-1 items-center justify-center"
            >
              <View
                className={`items-center rounded-2xl px-5 py-1 ${selected ? "bg-primary/15" : ""}`}
              >
                <AppText
                  className={`text-xl ${selected ? "text-primary" : "text-foreground"}`}
                >
                  {tab.icon}
                </AppText>
                <AppText
                  className={`text-xs ${selected ? "text-primary" : "text-foreground"}`}
                >
                  {i18n.t(tab.label)}
                </AppText>
              </View>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}
