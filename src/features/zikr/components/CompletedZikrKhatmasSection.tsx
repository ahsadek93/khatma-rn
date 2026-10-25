import { AppText } from "@/components/AppText";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { getMyCompletedKhatmas, type CompletedKhatma } from "@/features/khatma/api";
import { i18n } from "@/i18n";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";

export function CompletedZikrKhatmasSection() {
  const [khatmas, setKhatmas] = useState<CompletedKhatma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useFocusEffect(useCallback(() => {
    let isCurrent = true;
    void getMyCompletedKhatmas("zikr").then(({ data, error }) => {
      if (!isCurrent) return;
      if (error || !data) setHasError(true);
      else {
        setKhatmas(data);
        setHasError(false);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!isCurrent) return;
      setHasError(true);
      setIsLoading(false);
    });
    return () => { isCurrent = false; };
  }, []));

  return (
    <View className="mt-7">
      <View className="flex-row items-center justify-between">
        <AppText className="text-xl font-bold text-foreground">{i18n.t("completedZikrKhatmas")}</AppText>
        {isLoading ? <SkeletonBlock className="h-5 w-8" /> : <AppText className="text-xs font-bold text-secondary-foreground">{khatmas.length}</AppText>}
      </View>
      {isLoading ? (
        <View className="mt-3 gap-3">
          {[0, 1, 2].map((item) => (
            <View key={item} className="h-16 justify-center rounded-2xl border border-subtle-border bg-surface px-4">
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="mt-2 h-3 w-1/3" />
            </View>
          ))}
        </View>
      ) : hasError ? (
        <AppText className="mt-3 text-sm text-secondary-foreground">{i18n.t("zikrDashboardLoadError")}</AppText>
      ) : khatmas.length ? khatmas.slice(0, 3).map((khatma) => (
        <Pressable
          key={khatma.id}
          onPress={() => router.push({ pathname: "/(app)/zikr/khatma/[id]", params: { id: khatma.id, name: khatma.name, status: "completed", completedAt: khatma.completedAt } })}
          accessibilityRole="button"
          className="mt-3 rounded-2xl border border-subtle-border bg-surface px-4 py-3"
        >
          <AppText className="text-sm font-bold text-foreground">{khatma.name}</AppText>
          <AppText className="mt-1 text-xs text-secondary-foreground">{khatma.completedAt ? i18n.t("khatmaCompletedAt", { date: new Date(khatma.completedAt).toLocaleDateString(i18n.locale) }) : i18n.t("completedBadge")}</AppText>
        </Pressable>
      )) : (
        <View className="mt-3 rounded-2xl border border-subtle-border bg-surface p-4">
          <AppText className="text-sm font-bold text-foreground">{i18n.t("noCompletedZikrKhatmasTitle")}</AppText>
          <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t("noCompletedZikrKhatmasBody")}</AppText>
        </View>
      )}
    </View>
  );
}
