import { Cairo_400Regular } from "@expo-google-fonts/cairo/400Regular";
import { useFonts } from "@expo-google-fonts/cairo/useFonts";
import { Stack } from "expo-router";
import { useUnstableNativeVariable } from "nativewind";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { SettingsProvider, useSettings } from "@/stores/settings";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular });

  if (!fontsLoaded) return null;

  return (
    <SettingsProvider>
      <RootNavigator />
    </SettingsProvider>
  );
}

function RootNavigator() {
  const { language } = useSettings();
  const nativeBackground = useUnstableNativeVariable("--color-background");
  const backgroundColor = Platform.select({ web: "var(--color-background)", default: nativeBackground });
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { direction: language === "ar" ? "rtl" : "ltr", backgroundColor } }} />
    </SafeAreaView>
  );
}
