import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { i18n } from "@/i18n";
import { useReducedMotion } from "react-native-reanimated";

export default function AppLayout() {
  const reduceMotion = useReducedMotion();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#14271c" },
        tabBarActiveTintColor: "#d4af37",
        tabBarInactiveTintColor: "#f7f8f3",
        tabBarLabelStyle: { fontFamily: "Cairo_400Regular", fontSize: 12 },
        tabBarStyle: {
          backgroundColor: "#14271c",
          borderTopColor: "rgba(247, 248, 243, 0.1)",
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
