import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { View } from "react-native";

type CompletedKhatma = { name: string; date: string };

const completedKhatmas: CompletedKhatma[] = [
  { name: "khatmaGroupOne", date: "khatmaDateOne" },
  { name: "khatmaGroupTwo", date: "khatmaDateTwo" },
  { name: "khatmaGroupThree", date: "khatmaDateThree" },
];

export function CompletedKhatmasSection({
  khatmas = completedKhatmas,
}: {
  khatmas?: CompletedKhatma[];
}) {
  return (
    <View className="mt-7">
      <View className="flex-row items-center justify-between">
        <AppText className="text-xl font-bold text-foreground">
          {i18n.t("completedKhatmas")}
        </AppText>
        <AppText className="text-xs text-secondary-foreground">
          {khatmas.length || ""}
        </AppText>
      </View>
      {khatmas.length ? (
        khatmas.slice(0, 3).map(({ name, date }) => (
          <View
            key={name}
            className="mt-3 rounded-2xl border border-subtle-border bg-surface px-4 py-3"
          >
            <AppText className="text-sm font-bold text-foreground">
              {i18n.t(name)}
            </AppText>
            <AppText className="mt-1 text-xs text-secondary-foreground">
              {i18n.t(date)}
            </AppText>
          </View>
        ))
      ) : (
        <View className="mt-3 rounded-2xl border border-subtle-border bg-surface px-4 py-4">
          <AppText className="text-sm text-secondary-foreground">
            {i18n.t("noCompletedKhatmas")}
          </AppText>
        </View>
      )}
    </View>
  );
}
