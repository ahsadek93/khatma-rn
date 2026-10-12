import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { i18n } from "@/i18n";
import { useReducedMotion } from "react-native-reanimated";
import { useSettings } from "@/stores/settings";
import { useUnstableNativeVariable } from "nativewind";
import { Platform } from "react-native";

export default function AppLayout() {
  const reduceMotion = useReducedMotion();
  useSettings();
  const background = useUnstableNativeVariable("--color-background");
  const primary = useUnstableNativeVariable("--color-primary");
  const tabInactive = useUnstableNativeVariable("--color-tab-inactive");
  const subtleBorder = useUnstableNativeVariable("--color-subtle-border");
  const backgroundColor = Platform.select({ web: "var(--color-background)", default: background });
  const activeColor = Platform.select({ web: "var(--color-primary)", default: primary });
  const inactiveColor = Platform.select({ web: "var(--color-tab-inactive)", default: tabInactive });
  const borderColor = Platform.select({ web: "var(--color-subtle-border)", default: subtleBorder });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: { fontFamily: "Cairo_400Regular", fontSize: 12 },
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
        },
        animation: reduceMotion ? "none" : "fade",
        transitionSpec: {
          animation: "spring",
          config: { damping: 22, stiffness: 180 },
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: i18n.t("tabQuran"),
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="zikr"
        options={{
          title: i18n.t("tabZikr"),
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t("tabSettings"),
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "gearshape.fill", android: "settings", web: "settings" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
