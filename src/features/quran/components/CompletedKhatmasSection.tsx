import { AppText } from "@/components/AppText";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { i18n } from "@/i18n";
import { Pressable, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getMyCompletedKhatmas, type CompletedKhatma } from "@/features/khatma/api";

export function CompletedKhatmasSection() {
  const [khatmas, setKhatmas] = useState<CompletedKhatma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useFocusEffect(useCallback(() => {
    let isCurrent = true;
    setHasError(false);
    void getMyCompletedKhatmas("quran").then(({ data, error }) => {
      if (!isCurrent) return;
      if (error || !data) setHasError(true);
      else setKhatmas(data);
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
        <AppText className="text-xl font-bold text-foreground">
          {i18n.t("completedKhatmas")}
        </AppText>
        {isLoading ? <SkeletonBlock className="h-5 w-8" /> : (
          <View className="min-w-7 items-center rounded-full bg-surface px-2 py-1">
            <AppText className="text-xs font-bold text-secondary-foreground">{khatmas.length}</AppText>
          </View>
        )}
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
        <View className="mt-3 rounded-2xl border border-subtle-border bg-surface p-4">
          <AppText className="text-sm leading-6 text-secondary-foreground">{i18n.t("completedKhatmasLoadError")}</AppText>
        </View>
      ) : khatmas.length ? (
        khatmas.slice(0, 3).map(({ id, name, completedAt }) => (
          <Pressable
            key={id}
            className="mt-3 rounded-2xl border border-subtle-border bg-surface px-4 py-3"
              onPress={() => router.push({ pathname: "/(app)/home/khatma/[id]", params: { id, name, status: "completed", completedAt } })}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${i18n.t("completedBadge")}`}
          >
            <AppText className="text-sm font-bold text-foreground">
              {name}
            </AppText>
            <AppText className="mt-1 text-xs text-secondary-foreground">
              {completedAt ? i18n.t("khatmaCompletedAt", { date: new Date(completedAt).toLocaleDateString(i18n.locale) }) : i18n.t("completedBadge")}
            </AppText>
          </Pressable>
        ))
      ) : (
        <View className="mt-3 h-[216px] justify-center rounded-2xl border border-subtle-border bg-surface p-5">
          <View className="flex-row items-start gap-4">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-track">
              <AppText className="text-xl text-secondary-foreground">{"\u2713"}</AppText>
            </View>
            <View className="flex-1 pt-1">
              <AppText className="text-base font-bold text-foreground">{i18n.t("noCompletedKhatmasTitle")}</AppText>
              <AppText className="mt-1 text-sm leading-6 text-secondary-foreground">{i18n.t("noCompletedKhatmas")}</AppText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
