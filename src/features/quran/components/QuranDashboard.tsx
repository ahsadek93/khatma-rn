import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { ScrollView, View } from "react-native";
import { ActiveKhatmaSection } from "./ActiveKhatmaSection";
import { CompletedKhatmasSection } from "./CompletedKhatmasSection";
import { GroupKhatmaActions } from "./GroupKhatmaActions";

export function QuranDashboard() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-5 pt-6">
        <AppText className="text-3xl font-bold text-foreground">{i18n.t("tabQuran")}</AppText>
        <AppText className="mt-1 text-base text-secondary-foreground">{i18n.t("quranSubtitle")}</AppText>
        <ActiveKhatmaSection />
        <CompletedKhatmasSection />
      </ScrollView>
      <GroupKhatmaActions />
    </View>
  );
}
