import { AppText } from "@/components/AppText";
import { subscribeToKhatmaUpdates } from "@/data";
import { getMyActiveKhatmas, getMyCompletedKhatmas, type CompletedKhatma, type KhatmaSummary } from "@/features/khatma/api";
import { getKhatmaZikrProgress, type ZikrKhatmaProgress } from "@/features/zikr/api";
import { GroupKhatmaActions } from "@/features/khatma/components/GroupKhatmaActions";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";

type ActiveZikrKhatma = KhatmaSummary & { progress: ZikrKhatmaProgress };

export function ZikrDashboard() {
  useSettings();
  const [active, setActive] = useState<ActiveZikrKhatma[]>([]);
  const [completed, setCompleted] = useState<CompletedKhatma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadRef = useRef<(() => Promise<void>) | null>(null);
  const cardWidth = useWindowDimensions().width - 40;

  useFocusEffect(useCallback(() => {
    let current = true;
    const subscriptions = new Map<string, () => void>();

    const load = async () => {
      try {
        const [activeResult, completedResult] = await Promise.all([
          getMyActiveKhatmas("zikr"),
          getMyCompletedKhatmas("zikr"),
        ]);
        if (!current) return;
        if (activeResult.error || completedResult.error) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const progressResults = await Promise.all(activeResult.data.map(async (khatma) => ({
          khatma,
          result: await getKhatmaZikrProgress(khatma.id),
        })));
        if (!current) return;
        if (progressResults.some(({ result }) => result.error)) {
          setHasError(true);
          setIsLoading(false);
          return;
        }
        const nextActive = progressResults.map(({ khatma, result }) => ({ ...khatma, progress: result.data! }));
        setActive(nextActive);
        setCompleted(completedResult.data);
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
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-5 pt-6">
        <AppText className="text-3xl font-bold text-foreground">{i18n.t("tabZikr")}</AppText>
        <AppText className="mt-1 text-base text-secondary-foreground">{i18n.t("zikrSubtitle")}</AppText>

        <View className="mt-7">
          <AppText className="text-xl font-bold text-foreground">{i18n.t("activeZikrKhatma")}</AppText>
          {isLoading ? (
            <AppText className="mt-3 text-sm text-secondary-foreground">{i18n.t("loading")}</AppText>
          ) : hasError ? (
            <View className="mt-3 rounded-2xl border border-subtle-border bg-surface p-4">
              <AppText className="text-sm text-secondary-foreground">{i18n.t("zikrDashboardLoadError")}</AppText>
              <Pressable accessibilityRole="button" onPress={() => { setIsLoading(true); setHasError(false); void loadRef.current?.(); }} className="mt-3 self-start">
                <AppText className="font-bold text-primary">{i18n.t("refresh")}</AppText>
              </Pressable>
            </View>
          ) : !active.length ? (
            <View className="mt-3 rounded-3xl border border-subtle-border bg-surface p-5">
              <AppText className="text-base font-bold text-foreground">{i18n.t("noActiveZikrKhatmaTitle")}</AppText>
              <AppText className="mt-1 text-sm leading-6 text-secondary-foreground">{i18n.t("noActiveZikrKhatmaBody")}</AppText>
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

        <View className="mt-7">
          <View className="flex-row items-center justify-between">
            <AppText className="text-xl font-bold text-foreground">{i18n.t("completedZikrKhatmas")}</AppText>
            {!isLoading ? <AppText className="text-xs font-bold text-secondary-foreground">{completed.length}</AppText> : null}
          </View>
          {isLoading ? null : hasError ? (
            <AppText className="mt-3 text-sm text-secondary-foreground">{i18n.t("zikrDashboardLoadError")}</AppText>
          ) : completed.length ? completed.slice(0, 3).map((khatma) => (
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
      </ScrollView>
      <GroupKhatmaActions type="zikr" />
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
