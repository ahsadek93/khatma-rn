import { AppText } from "@/components/AppText";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { subscribeToKhatmaUpdates } from "@/data";
import { getMyActiveKhatmas, type KhatmaSummary } from "@/features/khatma/api";
import { getKhatmaZikrProgress, type ZikrKhatmaProgress } from "@/features/zikr/api";
import { i18n } from "@/i18n";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";

type ActiveZikrKhatma = KhatmaSummary & { progress: ZikrKhatmaProgress };

export function ActiveZikrKhatmaSection() {
  const [active, setActive] = useState<ActiveZikrKhatma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadRef = useRef<(() => Promise<void>) | null>(null);
  const cardWidth = useWindowDimensions().width - 40;

  useFocusEffect(useCallback(() => {
    let current = true;
    const subscriptions = new Map<string, () => void>();
    setIsLoading(true);
    setHasError(false);

    const load = async () => {
      try {
        const result = await getMyActiveKhatmas("zikr");
        if (!current) return;
        if (result.error) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const progressResults = await Promise.all(result.data.map(async (khatma) => ({
          khatma,
          result: await getKhatmaZikrProgress(khatma.id),
        })));
        if (!current) return;
        if (progressResults.some(({ result: progress }) => progress.error)) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const nextActive = progressResults.map(({ khatma, result: progress }) => ({ ...khatma, progress: progress.data! }));
        setActive(nextActive);
        setHasError(false);
        setIsLoading(false);

        const activeIds = new Set(nextActive.map((khatma) => khatma.id));
        for (const [id, unsubscribe] of subscriptions) {
          if (!activeIds.has(id)) {
            unsubscribe();
            subscriptions.delete(id);
          }
        }
        for (const khatma of nextActive) {
          if (!subscriptions.has(khatma.id)) {
            subscriptions.set(khatma.id, subscribeToKhatmaUpdates(khatma.id, "zikr", (event) => {
              if (event !== "connected") void load();
            }));
          }
        }
      } catch {
        if (!current) return;
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadRef.current = load;
    void load();
    return () => {
      current = false;
      loadRef.current = null;
      for (const unsubscribe of subscriptions.values()) unsubscribe();
    };
  }, []));

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
          <Pressable accessibilityRole="button" onPress={() => { setIsLoading(true); setHasError(false); void loadRef.current?.(); }} className="mt-3 self-start">
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
