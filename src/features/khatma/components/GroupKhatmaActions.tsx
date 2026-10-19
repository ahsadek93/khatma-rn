import { AppText } from "@/components/AppText";
import type { KhatmaType } from "@/data/contracts";
import { i18n } from "@/i18n";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

export function GroupKhatmaActions({ type = "quran" }: { type?: KhatmaType }) {
  return (
    <View className="border-t border-subtle-border px-5 py-4">
      <AppText className="mb-3 text-xl font-bold text-foreground">{i18n.t(type === "zikr" ? "moreZikrKhatmas" : "moreKhatmas")}</AppText>
      <View className="flex-row gap-3">
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/(app)/create-khatma", params: { type } })} className="flex-1 items-center rounded-2xl bg-primary px-3 py-4">
          <AppText className="text-base font-bold text-background">{i18n.t(type === "zikr" ? "createZikrGroupKhatma" : "createGroupKhatma")}</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/join-khatma")} className="flex-1 items-center rounded-2xl border border-primary/50 px-3 py-4">
          <AppText className="text-base font-bold text-primary">{i18n.t(type === "zikr" ? "joinZikrGroupKhatma" : "joinGroupKhatma")}</AppText>
        </Pressable>
      </View>
    </View>
  );
}
