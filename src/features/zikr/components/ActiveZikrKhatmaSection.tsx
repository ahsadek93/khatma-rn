import { AppText } from "@/components/AppText";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { useKhatmaRealtime } from "@/features/khatma/realtime";
import { useMyKhatmas } from "@/features/khatma/api";
import { getKhatmaZikrProgress } from "@/features/zikr/api";
import { unwrap } from "@/data/results";
import { i18n } from "@/i18n";
import { router } from "expo-router";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";

export function ActiveZikrKhatmaSection() {
  const cardWidth = useWindowDimensions().width - 40;
  const queryClient = useQueryClient();
  const list = useMyKhatmas("zikr", "active");
  const khatmas = list.data?.data ?? [];
  const progress = useQueries({
    queries: khatmas.map(({ id }) => ({
      queryKey: ["khatma", id, "progress"],
      queryFn: async () => unwrap(await getKhatmaZikrProgress(id)),
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isPending: results.some((r) => r.isPending),
      isError: results.some((r) => r.isError),
    }),
  });
  useKhatmaRealtime(khatmas.map(({ id }) => id));

  const isLoading = list.isPending || progress.isPending;
  const hasError = list.isError || progress.isError;
  const active = khatmas.map((khatma, i) => ({ ...khatma, progress: progress.data[i]! }));

  return (
    <View className="mt-7">
      <AppText className="text-xl font-bold text-foreground">{i18n.t("activeZikrKhatma")}</AppText>
      {isLoading ? (
        <View className="mt-3 h-[280px] rounded-3xl border border-subtle-border bg-surface p-5">
          <View className="flex-row items-center justify-between">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-6 w-24" />
          </View>
          <SkeletonBlock className="mt-5 h-7 w-3/5" />
          <SkeletonBlock className="mt-2 h-4 w-2/5" />
          <View className="mt-6 flex-row items-center justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-16" />
          </View>
          <SkeletonBlock className="mt-3 h-2 w-full" />
          <View className="mt-5 flex-row items-center justify-between border-t border-subtle-border pt-4">
            <View className="gap-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-5 w-32" />
            </View>
            <SkeletonBlock className="h-4 w-24" />
          </View>
        </View>
      ) : hasError ? (
        <View className="mt-3 rounded-2xl border border-subtle-border bg-surface p-4">
          <AppText className="text-sm text-secondary-foreground">{i18n.t("zikrDashboardLoadError")}</AppText>
          <Pressable accessibilityRole="button" onPress={() => { void queryClient.invalidateQueries({ queryKey: ["khatmas", "zikr", "active"] }); void queryClient.invalidateQueries({ queryKey: ["khatma"] }); }} className="mt-3 self-start">
            <AppText className="font-bold text-primary">{i18n.t("refresh")}</AppText>
          </Pressable>
        </View>
      ) : !active.length ? (
        <View className="mt-3 h-[280px] justify-center rounded-3xl border border-subtle-border bg-surface p-5">
          <View className="flex-row items-start gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <View className="gap-1">
                <View className="h-1 w-5 rounded-full bg-primary" />
                <View className="h-1 w-4 rounded-full bg-primary/70" />
                <View className="h-1 w-5 rounded-full bg-primary/40" />
              </View>
            </View>
            <View className="flex-1 pt-1">
              <AppText className="text-lg font-bold text-foreground">{i18n.t("noActiveZikrKhatmaTitle")}</AppText>
              <AppText className="mt-1 text-sm leading-6 text-secondary-foreground">{i18n.t("noActiveZikrKhatmaBody")}</AppText>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerClassName="mt-3">
          {active.map((khatma) => (
            <Pressable
              key={khatma.id}
              style={{ width: cardWidth }}
              onPress={() => router.push({ pathname: "/(app)/zikr/khatma/[id]", params: { id: khatma.id, name: khatma.name, status: "active" } })}
              accessibilityRole="button"
              accessibilityLabel={`${khatma.name}, ${i18n.t("viewZikrKhatma")}`}
              className="rounded-3xl border border-primary/30 bg-surface p-5"
            >
              <View className="flex-row items-center justify-between">
                <AppText className="text-sm font-bold text-primary">{i18n.t("inProgress")}</AppText>
                <AppText className="text-xs text-secondary-foreground">{i18n.t("activeGroupMembers", { count: khatma.memberCount })}</AppText>
              </View>
              <AppText className="mt-3 text-xl font-bold text-foreground">{khatma.name}</AppText>
              <AppText className="mt-2 text-base leading-7 text-foreground">{khatma.progress.phrase}</AppText>
              <View className="mt-5 flex-row flex-wrap justify-between gap-y-2">
                <Count label={i18n.t("zikrCompleted")} value={khatma.progress.completedCount} />
                <Count label={i18n.t("zikrPending")} value={khatma.progress.pendingCount} />
                <Count label={i18n.t("zikrFree")} value={Math.max(0, khatma.progress.goalCount - khatma.progress.completedCount - khatma.progress.pendingCount)} />
              </View>
              <AppText className="mt-3 text-sm text-secondary-foreground">{i18n.t("zikrGoalValue", { count: khatma.progress.goalCount })}</AppText>
              <View className="mt-2 h-2 overflow-hidden rounded-full bg-track">
                <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (khatma.progress.completedCount / khatma.progress.goalCount) * 100)}%` }} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <AppText className="text-xs text-secondary-foreground">{label}</AppText>
      <AppText className="mt-1 text-base font-bold text-foreground">{value.toLocaleString(i18n.locale)}</AppText>
    </View>
  );
}
