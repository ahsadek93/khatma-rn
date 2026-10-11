import { Stack } from "expo-router";
import { I18nManager, Platform } from "react-native";
import { defaultLanguage } from "../i18n";
import "../../global.css";

if (Platform.OS !== "web") {
  const isRTL = defaultLanguage === "ar";
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
}

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
