import { AppText } from "@/components/AppText";
import { getKhatmaMembers } from "@/features/khatma/api";
import { getKhatmaJuz, type QuranJuz } from "@/features/quran/api";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function KhatmaDetails() {
  useSettings();
  const { id, name, status, completedAt } = useLocalSearchParams<{
    id: string;
    name: string;
    status: "active" | "completed";
    completedAt?: string;
  }>();
  const [juz, setJuz] = useState<QuranJuz[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const completedCount = juz.filter((item) => item.status === "completed").length;
  const isCompleted = status === "completed";

  useFocusEffect(useCallback(() => {
    let current = true;
    setIsLoading(true);
    setHasError(false);
    void Promise.all([getKhatmaJuz(id), getKhatmaMembers(id)]).then(([juzResult, membersResult]) => {
      if (!current) return;
      if (juzResult.error || membersResult.error) setHasError(true);
      else {
        setJuz(juzResult.data);
        setMemberCount(membersResult.data.length);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!current) return;
      setHasError(true);
      setIsLoading(false);
    });
    return () => { current = false; };
  }, [id]));

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-5">
        <Pressable onPress={() => router.back()} className="mb-5 self-start rounded-full bg-surface px-4 py-2" accessibilityRole="button">
          <AppText className="font-bold text-primary">{`‹  ${i18n.t("back")}`}</AppText>
        </Pressable>
        <View className="rounded-3xl border border-subtle-border bg-surface p-5">
          <View className="flex-row items-center justify-between">
            <AppText className="text-sm font-bold text-primary">{i18n.t("khatmaDetails")}</AppText>
            <View className="rounded-full bg-primary/15 px-3 py-1">
              <AppText className="text-xs font-bold text-primary">{i18n.t(isCompleted ? "completedBadge" : "inProgress")}</AppText>
            </View>
          </View>
          <AppText className="mt-4 text-2xl font-bold text-foreground">{name}</AppText>
          <AppText className="mt-2 text-sm text-secondary-foreground">{i18n.t("activeGroupMembers", { count: memberCount })}</AppText>
          {isCompleted && completedAt ? <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t("khatmaCompletedAt", { date: new Date(completedAt).toLocaleDateString(i18n.locale) })}</AppText> : null}
          <View className="mt-6 flex-row items-end justify-between">
            <AppText className="text-sm text-secondary-foreground">{i18n.t("completedJuz")}</AppText>
            <AppText className="text-lg font-bold text-primary">{i18n.t("juzProgressValue", { completed: completedCount })}</AppText>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-track">
            <View className="h-full rounded-full bg-primary" style={{ width: `${(completedCount / 30) * 100}%` }} />
          </View>
        </View>

        <View className="mt-7">
          <AppText className="text-xl font-bold text-foreground">{i18n.t("khatmaJuzTitle")}</AppText>
          <AppText className="mt-1 text-sm leading-6 text-secondary-foreground">{i18n.t(isCompleted ? "khatmaJuzCompletedHint" : "khatmaJuzActiveHint")}</AppText>
          {isLoading ? <AppText className="mt-4 text-sm text-secondary-foreground">{i18n.t("loading")}</AppText> : hasError ? (
            <View className="mt-4 rounded-2xl border border-subtle-border bg-surface p-4"><AppText className="text-sm text-secondary-foreground">{i18n.t("khatmaDetailsLoadError")}</AppText></View>
          ) : (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {juz.map((item) => {
                const stateLabel = item.status === "completed" ? "juzCompleted" : item.status === "claimed" ? "juzClaimed" : "juzAvailable";
                const style = item.status === "completed" ? "border-primary bg-primary" : item.status === "claimed" ? "border-primary/40 bg-primary/10" : "border-subtle-border bg-surface";
                const textStyle = item.status === "completed" ? "text-white" : "text-foreground";
                return (
                  <View key={item.juzNumber} className={`w-[18%] items-center rounded-2xl border px-1 py-3 ${style}`}>
                    <AppText className={`text-base font-bold ${textStyle}`}>{item.juzNumber}</AppText>
                    <AppText className={`mt-1 text-[10px] ${textStyle}`}>{i18n.t(stateLabel)}</AppText>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
