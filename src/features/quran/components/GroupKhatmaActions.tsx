import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { View } from "react-native";

export function GroupKhatmaActions() {
  return (
    <View className="border-t border-white/10 px-5 py-4">
      <AppText className="mb-3 text-xl font-bold text-foreground">{i18n.t("moreKhatmas")}</AppText>
      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-2xl bg-primary px-3 py-4">
          <AppText className="text-base font-bold text-background">{i18n.t("createGroupKhatma")}</AppText>
        </View>
        <View className="flex-1 items-center rounded-2xl border border-primary/50 px-3 py-4">
          <AppText className="text-base font-bold text-primary">{i18n.t("joinGroupKhatma")}</AppText>
        </View>
      </View>
    </View>
  );
}
