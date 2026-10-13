import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { View } from "react-native";
import { useEffect, useState } from "react";
import { getMyActiveKhatma, type KhatmaSummary } from "@/features/khatma/api";
import { getKhatmaQuranProgress } from "../api";
import { SkeletonBlock } from "./SkeletonBlock";

type Khatma = KhatmaSummary & { completedJuz: number; selectedJuz: number[] };

export function ActiveKhatmaSection() {
  const [khatma, setKhatma] = useState<Khatma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const progress = khatma ? Math.round((khatma.completedJuz / 30) * 100) : 0;

  useEffect(() => {
    let isCurrent = true;
    void (async () => {
      const { data: active, error } = await getMyActiveKhatma();
      if (!isCurrent) return;
      if (error) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      if (!active) {
        setIsLoading(false);
        return;
      }

      const { data, error: progressError } = await getKhatmaQuranProgress(active.id);
      if (!isCurrent) return;
      if (progressError || !data) {
        setHasError(true);
      } else {
        setKhatma({ ...active, ...data });
      }
      setIsLoading(false);
    })().catch(() => {
      if (!isCurrent) return;
      setHasError(true);
      setIsLoading(false);
    });
    return () => { isCurrent = false; };
  }, []);

  return (
    <View className="mt-7">
      {isLoading ? (
        <View className="h-[280px] rounded-3xl border border-subtle-border bg-surface p-5">
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
        <View className="rounded-3xl border border-subtle-border bg-surface p-5">
          <AppText className="text-base font-bold text-foreground">{i18n.t("activeKhatma")}</AppText>
          <AppText className="mt-2 text-sm leading-6 text-secondary-foreground">{i18n.t("activeKhatmaLoadError")}</AppText>
        </View>
      ) : !khatma ? (
        <View className="h-[280px] justify-center rounded-3xl border border-subtle-border bg-surface p-5">
          <View className="flex-row items-start gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <View className="gap-1">
                <View className="h-1 w-5 rounded-full bg-primary" />
                <View className="h-1 w-4 rounded-full bg-primary/70" />
                <View className="h-1 w-5 rounded-full bg-primary/40" />
              </View>
            </View>
            <View className="flex-1 pt-1">
              <AppText className="text-lg font-bold text-foreground">{i18n.t("noActiveKhatmaTitle")}</AppText>
              <AppText className="mt-1 text-sm leading-6 text-secondary-foreground">{i18n.t("noActiveKhatmaBody")}</AppText>
            </View>
          </View>
        </View>
      ) : (
        <View className="rounded-3xl border border-primary/30 bg-surface p-5">
          <View className="flex-row items-center justify-between">
            <AppText className="text-sm font-bold text-primary">{i18n.t("activeKhatma")}</AppText>
            <View className="rounded-full bg-primary/15 px-3 py-1">
              <AppText className="text-xs font-bold text-primary">{i18n.t("inProgress")}</AppText>
            </View>
          </View>
          <AppText className="mt-4 text-2xl font-bold text-foreground">{khatma.name}</AppText>
          <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t("activeGroupMembers", { count: khatma.memberCount })}</AppText>
          <View className="mt-5 flex-row items-center justify-between">
            <AppText className="text-sm text-secondary-foreground">{i18n.t("completedJuz")}</AppText>
            <AppText className="text-sm font-bold text-primary">{i18n.t("juzProgressValue", { completed: khatma.completedJuz })}</AppText>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-track">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
          <View className="mt-5 flex-row items-center justify-between border-t border-subtle-border pt-4">
            <View className="flex-1">
              <AppText className="text-xs text-secondary-foreground">{i18n.t("selectedJuz")}</AppText>
              <AppText className="mt-1 text-base font-bold text-foreground">{khatma.selectedJuz.length ? i18n.t("selectedJuzList", { numbers: khatma.selectedJuz.join(", ") }) : i18n.t("noSelectedJuz")}</AppText>
            </View>
            <AppText className="text-sm font-bold text-primary">{i18n.t("viewKhatma")}</AppText>
          </View>
        </View>
      )}
    </View>
  );
}
