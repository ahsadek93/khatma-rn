import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { View } from "react-native";

const completedKhatmas = [
  { name: "khatmaGroupOne", date: "khatmaDateOne", members: 12 },
  { name: "khatmaGroupTwo", date: "khatmaDateTwo", members: 8 },
  { name: "khatmaGroupThree", date: "khatmaDateThree", members: 6 },
];

export function CompletedKhatmasSection() {
  return (
    <View className="mt-7">
      <View className="flex-row items-center justify-between">
        <AppText className="text-xl font-bold text-foreground">{i18n.t("completedKhatmas")}</AppText>
        <AppText className="text-sm text-secondary-foreground">3</AppText>
      </View>
      {completedKhatmas.slice(0, 3).map(({ name, date, members }) => (
        <View key={name} className="mt-3 flex-row items-center justify-between rounded-2xl border border-subtle-border bg-surface p-4">
          <View>
            <AppText className="text-base font-bold text-foreground">{i18n.t(name)}</AppText>
            <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t(date)} - {i18n.t("groupMemberCount", { count: members })}</AppText>
          </View>
          <AppText className="text-xs font-bold text-primary">{i18n.t("completedBadge")}</AppText>
        </View>
      ))}
      <View className="mt-3 self-start rounded-full border border-primary/50 px-4 py-2">
        <AppText className="text-sm font-bold text-primary">{i18n.t("viewMore")}</AppText>
      </View>
    </View>
  );
}
