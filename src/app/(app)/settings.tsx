import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { Pressable, View } from "react-native";

export default function Settings() {
  const { theme, setTheme, language, setLanguage } = useSettings();
  return (
    <View className="flex-1 bg-background px-5 pt-8">
      <AppText className="text-3xl font-bold text-foreground">{i18n.t("tabSettings")}</AppText>
      <AppText className="mb-3 mt-8 text-lg font-bold text-foreground">{i18n.t("appearance")}</AppText>
      <View className="flex-row gap-3">
        {(["light", "dark"] as const).map((option) => (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: theme === option }} onPress={() => setTheme(option)} className={`flex-1 items-center rounded-2xl border px-4 py-3 ${theme === option ? "border-primary bg-primary/15" : "border-primary/30"}`}>
            <AppText className="font-bold text-foreground">{i18n.t(option)}</AppText>
          </Pressable>
        ))}
      </View>
      <AppText className="mb-3 mt-8 text-lg font-bold text-foreground">{i18n.t("language")}</AppText>
      <View className="flex-row gap-3">
        {(["ar", "en"] as const).map((option) => (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: language === option }} onPress={() => setLanguage(option)} className={`flex-1 items-center rounded-2xl border px-4 py-3 ${language === option ? "border-primary bg-primary/15" : "border-primary/30"}`}>
            <AppText className="font-bold text-foreground">{i18n.t(option === "ar" ? "arabic" : "english")}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
