import { Stack } from "expo-router";
import { Cairo_400Regular } from "@expo-google-fonts/cairo/400Regular";
import { useFonts } from "@expo-google-fonts/cairo/useFonts";
import { I18nManager, Platform } from "react-native";
import { defaultLanguage } from "../i18n";
import "../../global.css";

if (Platform.OS !== "web") {
  const isRTL = defaultLanguage === "ar";
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular });

  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { direction: defaultLanguage === "ar" ? "rtl" : "ltr" },
      }}
    />
  );
}
