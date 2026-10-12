import { Tabs } from "expo-router";
import { i18n } from "@/i18n";
import { useReducedMotion } from "react-native-reanimated";

export default function AppLayout() {
  const reduceMotion = useReducedMotion();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#14271c" },
        animation: reduceMotion ? "none" : "fade",
        transitionSpec: {
          animation: "spring",
          config: { damping: 22, stiffness: 180 },
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: i18n.t("tabQuran") }} />
      <Tabs.Screen name="zikr" options={{ title: i18n.t("tabZikr") }} />
      <Tabs.Screen name="settings" options={{ title: i18n.t("tabSettings") }} />
    </Tabs>
  );
}
