import { AppText } from "@/components/AppText";
import { GroupKhatmaActions } from "@/features/khatma/components/GroupKhatmaActions";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { ScrollView, View } from "react-native";
import { ActiveZikrKhatmaSection } from "./ActiveZikrKhatmaSection";
import { CompletedZikrKhatmasSection } from "./CompletedZikrKhatmasSection";

export function ZikrDashboard() {
  useSettings();

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-5 pt-6">
        <AppText className="text-3xl font-bold text-foreground">{i18n.t("tabZikr")}</AppText>
        <AppText className="mt-1 text-base text-secondary-foreground">{i18n.t("zikrSubtitle")}</AppText>
        <ActiveZikrKhatmaSection />
        <CompletedZikrKhatmasSection />
      </ScrollView>
      <GroupKhatmaActions type="zikr" />
    </View>
  );
}
