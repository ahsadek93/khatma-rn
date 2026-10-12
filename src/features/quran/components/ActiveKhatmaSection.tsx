import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { View } from "react-native";

export function ActiveKhatmaSection() {
  return (
    <View className="mt-7">
      <View className="flex-row items-center justify-between">
        <AppText className="text-xl font-bold text-foreground">{i18n.t("activeKhatma")}</AppText>
        <View className="rounded-full bg-primary/15 px-3 py-1">
          <AppText className="text-xs font-bold text-primary">{i18n.t("inProgress")}</AppText>
        </View>
      </View>

      <View className="mt-3 rounded-3xl border border-primary/30 bg-surface p-5">
        <AppText className="text-2xl font-bold text-foreground">{i18n.t("activeGroupName")}</AppText>
        <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t("activeGroupMembers", { count: 12 })}</AppText>
        <View className="mt-5 flex-row items-center justify-between">
          <AppText className="text-sm text-secondary-foreground">{i18n.t("completedJuz")}</AppText>
          <AppText className="text-sm font-bold text-primary">{i18n.t("completedJuzValue")}</AppText>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-track">
          <View className="h-full w-[40%] rounded-full bg-primary" />
        </View>
        <View className="mt-5 flex-row items-center justify-between border-t border-subtle-border pt-4">
          <View>
            <AppText className="text-xs text-secondary-foreground">{i18n.t("selectedJuz")}</AppText>
            <AppText className="mt-1 text-base font-bold text-foreground">{i18n.t("selectedJuzValue")}</AppText>
          </View>
          <AppText className="text-sm font-bold text-primary">{i18n.t("viewKhatma")}</AppText>
        </View>
      </View>
    </View>
  );
}
