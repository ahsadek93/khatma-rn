import { AppText } from "@/components/AppText";
import { subscribeToKhatmaUpdates } from "@/data";
import { getCurrentUser } from "@/features/auth/api";
import { getKhatmaJoinCode, getKhatmaMembers, type KhatmaMember } from "@/features/khatma/api";
import { claimJuz, completeJuz, getKhatmaJuz, type QuranJuz } from "@/features/quran/api";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function KhatmaDetails() {
  useSettings();
  const reduceMotion = useReducedMotion();
  const { id, name, status, completedAt } = useLocalSearchParams<{
    id: string;
    name: string;
    status: "active" | "completed";
    completedAt?: string;
  }>();
  const [juz, setJuz] = useState<QuranJuz[]>([]);
  const [members, setMembers] = useState<KhatmaMember[]>([]);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [joinCodeError, setJoinCodeError] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<QuranJuz | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [showMyJuzOnly, setShowMyJuzOnly] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const sheetY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const completedCount = juz.filter((item) => item.status === "completed").length;
  const visibleJuz = showMyJuzOnly ? juz.filter((item) => item.status !== "free" && item.claimedBy === currentUserId) : juz;
  const isCompleted = currentStatus === "completed";

  useFocusEffect(useCallback(() => {
    let current = true;
    setIsLoading(true);
    setHasError(false);
    void Promise.all([
      getKhatmaJuz(id),
      getKhatmaMembers(id),
      getCurrentUser(),
      status === "active" ? getKhatmaJoinCode(id) : Promise.resolve(null),
    ]).then(([juzResult, membersResult, userResult, joinCodeResult]) => {
      if (!current) return;
      if (juzResult.error || membersResult.error) setHasError(true);
      else {
        setJuz(juzResult.data);
        setMembers(membersResult.data);
        setCurrentUserId(userResult.error ? null : userResult.data?.id ?? null);
      }
      if (status === "active") {
        if (joinCodeResult?.error || !joinCodeResult?.data) setJoinCodeError(true);
        else setJoinCode(joinCodeResult.data);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!current) return;
      setHasError(true);
      setIsLoading(false);
    });

    const refreshLiveDetails = () => {
      void Promise.all([getKhatmaJuz(id), getKhatmaMembers(id)]).then(([juzResult, membersResult]) => {
        if (!current) return;
        if (juzResult.error || membersResult.error) {
          setHasError(true);
          return;
        }
        setJuz(juzResult.data);
        setMembers(membersResult.data);
        setHasError(false);
      }).catch(() => {
        if (current) setHasError(true);
      });
    };

    const unsubscribe = subscribeToKhatmaUpdates(id, (event) => {
      if (event === "completed") setCurrentStatus("completed");
      else if (event !== "connected") refreshLiveDetails();
    });

    return () => {
      current = false;
      unsubscribe();
    };
  }, [id, status]));

  const handleJuzAction = async (action: "claim" | "complete") => {
    if (!selectedJuz) return;
    setIsSaving(true);
    setActionError(false);
    const result = action === "claim"
      ? await claimJuz(id, selectedJuz.juzNumber)
      : await completeJuz(id, selectedJuz.juzNumber);
    if (result.error) {
      setActionError(true);
      setIsSaving(false);
      return;
    }
    setJuz((items) => items.map((item) => item.juzNumber === selectedJuz.juzNumber
      ? { ...item, status: action === "claim" ? "claimed" : "completed", claimedBy: currentUserId }
      : item));
    closeSheet();
    setIsSaving(false);
    const refreshed = await getKhatmaJuz(id);
    if (!refreshed.error) setJuz(refreshed.data);
  };

  const handleShare = () => {
    if (!joinCode) return;
    setShareError(false);
    void Share.share({ message: i18n.t("shareKhatmaMessage", { name, code: joinCode }) ?? "" })
      .catch(() => setShareError(true));
  };

  const openSheet = (item: QuranJuz) => {
    sheetY.value = reduceMotion ? 0 : 420;
    backdropOpacity.value = 0;
    setSelectedJuz(item);
    setActionError(false);
    if (reduceMotion) return;
    requestAnimationFrame(() => {
      sheetY.value = withSpring(0, { damping: 26, stiffness: 240, mass: 0.85 });
      backdropOpacity.value = withTiming(0.52, { duration: 220 });
    });
  };

  const closeSheet = () => {
    if (reduceMotion) {
      setSelectedJuz(null);
      setShowMembers(false);
      return;
    }
    sheetY.value = withTiming(420, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(finishClosingSheet)();
    });
    backdropOpacity.value = withTiming(0, { duration: 180 });
  };

  const finishClosingSheet = () => {
    setSelectedJuz(null);
    setShowMembers(false);
  };

  const openMembersSheet = () => {
    sheetY.value = reduceMotion ? 0 : 420;
    backdropOpacity.value = 0;
    setShowMembers(true);
    if (reduceMotion) return;
    requestAnimationFrame(() => {
      sheetY.value = withSpring(0, { damping: 26, stiffness: 240, mass: 0.85 });
      backdropOpacity.value = withTiming(0.52, { duration: 220 });
    });
  };

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
          <Pressable onPress={openMembersSheet} accessibilityRole="button" accessibilityLabel={i18n.t("activeGroupMembers", { count: members.length })} className="mt-2 self-start">
            <AppText className="text-sm text-secondary-foreground underline">{i18n.t("activeGroupMembers", { count: members.length })}</AppText>
          </Pressable>
          {isCompleted && completedAt ? <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t("khatmaCompletedAt", { date: new Date(completedAt).toLocaleDateString(i18n.locale) })}</AppText> : null}
          <View className="mt-6 flex-row items-end justify-between">
            <AppText className="text-sm text-secondary-foreground">{i18n.t("completedJuz")}</AppText>
            <AppText className="text-lg font-bold text-primary">{i18n.t("juzProgressValue", { completed: completedCount })}</AppText>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-track">
            <View className="h-full rounded-full bg-primary" style={{ width: `${(completedCount / 30) * 100}%` }} />
          </View>
          {!isCompleted ? joinCode ? (
            <Pressable onPress={handleShare} accessibilityRole="button" className="mt-5 items-center rounded-2xl bg-primary px-4 py-3">
              <AppText className="font-bold text-background">{i18n.t("shareKhatma")}</AppText>
            </Pressable>
          ) : joinCodeError ? (
            <AppText className="mt-4 text-sm text-secondary-foreground">{i18n.t("khatmaCodeLoadError")}</AppText>
          ) : null : null}
          {shareError ? <AppText accessibilityRole="alert" className="mt-3 text-sm text-red-500">{i18n.t("shareKhatmaError")}</AppText> : null}
        </View>

        <View className="mt-7">
          <AppText className="text-xl font-bold text-foreground">{i18n.t("khatmaJuzTitle")}</AppText>
          <AppText className="mt-1 text-sm leading-6 text-secondary-foreground">{i18n.t(isCompleted ? "khatmaJuzCompletedHint" : "khatmaJuzActiveHint")}</AppText>
          <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
            {[["bg-white", "juzAvailable"], ["bg-green-900", "juzCompleted"], ["bg-yellow-600", "juzClaimedByYouLegend"], ["bg-gray-500", "juzClaimedByOtherLegend"]].map(([color, label]) => (
              <View key={label} className="flex-row items-center gap-2">
                <View className={`h-3 w-3 rounded-sm ${color}`} />
                <AppText className="text-xs text-secondary-foreground">{i18n.t(label)}</AppText>
              </View>
            ))}
          </View>
          <View className="mt-4 flex-row gap-2">
            {[false, true].map((myOnly) => (
              <Pressable
                key={String(myOnly)}
                onPress={() => setShowMyJuzOnly(myOnly)}
                accessibilityRole="button"
                accessibilityState={{ selected: showMyJuzOnly === myOnly }}
                className={`rounded-full px-4 py-2 ${showMyJuzOnly === myOnly ? "bg-primary" : "bg-surface"}`}
              >
                <AppText className={`text-sm font-bold ${showMyJuzOnly === myOnly ? "text-background" : "text-secondary-foreground"}`}>
                  {i18n.t(myOnly ? "myJuzFilter" : "allJuzFilter")}
                </AppText>
              </Pressable>
            ))}
          </View>
          {isLoading ? <AppText className="mt-4 text-sm text-secondary-foreground">{i18n.t("loading")}</AppText> : hasError ? (
            <View className="mt-4 rounded-2xl border border-subtle-border bg-surface p-4"><AppText className="text-sm text-secondary-foreground">{i18n.t("khatmaDetailsLoadError")}</AppText></View>
          ) : showMyJuzOnly && visibleJuz.length === 0 ? (
            <AppText className="mt-4 text-sm text-secondary-foreground">{i18n.t("noMyJuzFilterResults")}</AppText>
          ) : (
            <View className="mt-4 flex-row flex-wrap justify-start gap-x-2 gap-y-2">
              {visibleJuz.map((item) => {
                const stateLabel = item.status === "completed" ? "juzCompleted" : item.status === "claimed" ? "juzClaimed" : "juzAvailable";
                const style = item.status === "completed" ? "border-green-900 bg-green-900" : item.status === "claimed" ? item.claimedBy === currentUserId ? "border-yellow-600 bg-yellow-600" : "border-gray-500 bg-gray-500" : "border-gray-300 bg-white";
                const textStyle = item.status === "completed" ? "text-white" : "text-gray-900";
                return (
                  <Pressable key={item.juzNumber} onPress={() => openSheet(item)} accessibilityRole="button" accessibilityLabel={`${i18n.t("juzNumberLabel", { number: item.juzNumber })}, ${i18n.t(stateLabel)}`} className={`w-[14%] aspect-square items-center justify-center rounded-md border ${style}`}>
                    <AppText className={`h-full w-full text-center text-sm font-bold ${textStyle}`} style={{ textAlignVertical: "center", includeFontPadding: false }}>{item.juzNumber}</AppText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <Modal visible={selectedJuz !== null || showMembers} transparent presentationStyle="overFullScreen" animationType="none" onRequestClose={() => !isSaving && closeSheet()}>
        <View className="flex-1 justify-end">
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backdropStyle]} className="bg-black" />
          <Pressable className="absolute inset-0" accessibilityRole="button" accessibilityLabel={i18n.t("close")} onPress={() => !isSaving && closeSheet()} />
          <Animated.View style={sheetStyle} className={showMembers ? "h-[80%] w-full" : "w-full"}>
          <View className={`max-h-[90%] rounded-t-3xl border-t border-subtle-border bg-background px-5 pb-8 pt-5 ${showMembers ? "flex-1" : ""}`}>
            {showMembers ? <>
              <AppText className="mb-4 text-xl font-bold text-foreground">{i18n.t("khatmaParticipants")}</AppText>
              <AppText className="-mt-2 mb-3 text-sm text-secondary-foreground">{i18n.t("activeGroupMembers", { count: members.length })}</AppText>
              <ScrollView className="flex-1 rounded-2xl bg-surface px-2 py-2" showsVerticalScrollIndicator persistentScrollbar>
                <View className="gap-2">
                  {members.map((member) => (
                    <View key={member.userId} className="flex-row items-center rounded-xl bg-surface px-3 py-3">
                      <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                        <AppText className="font-bold text-primary">{(member.displayName || i18n.t("unknownKhatmaMember") || "?").slice(0, 1)}</AppText>
                      </View>
                      <AppText className="flex-1 text-sm font-medium text-foreground">{member.displayName || i18n.t("unknownKhatmaMember")}</AppText>
                      {member.role === "owner" ? <AppText className="text-xs text-secondary-foreground">{i18n.t("khatmaOwner")}</AppText> : null}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <Pressable onPress={closeSheet} accessibilityRole="button" className="mt-4 items-center rounded-xl bg-surface px-4 py-3"><AppText className="font-bold text-foreground">{i18n.t("close")}</AppText></Pressable>
            </> : selectedJuz ? <>
              <AppText className="text-xl font-bold text-foreground">{i18n.t("juzNumberLabel", { number: selectedJuz.juzNumber })}</AppText>
              <AppText className="mt-2 text-sm text-secondary-foreground">{selectedJuz.status === "free"
                ? i18n.t("juzAvailable")
                : selectedJuz.status === "claimed" && selectedJuz.claimedBy === currentUserId
                  ? i18n.t("juzClaimedByYou")
                  : i18n.t(selectedJuz.status === "completed"
                    ? selectedJuz.claimedBy === currentUserId ? "juzCompletedByYou" : "juzCompletedByName"
                    : "juzClaimedByName", { name: selectedJuz.claimedByName ?? i18n.t("unknownKhatmaMember") })}</AppText>
              {actionError ? <AppText accessibilityRole="alert" className="mt-3 text-sm text-red-500">{i18n.t("juzActionError")}</AppText> : null}
              {!isCompleted && selectedJuz.status === "free" ? <Pressable disabled={isSaving} onPress={() => void handleJuzAction("claim")} accessibilityRole="button" className="mt-5 items-center rounded-xl bg-primary px-4 py-3"><AppText className="font-bold text-background">{i18n.t(isSaving ? "loading" : "claimJuz")}</AppText></Pressable> : null}
              {!isCompleted && selectedJuz.status === "claimed" && selectedJuz.claimedBy === currentUserId ? <Pressable disabled={isSaving} onPress={() => void handleJuzAction("complete")} accessibilityRole="button" className="mt-5 items-center rounded-xl bg-primary px-4 py-3"><AppText className="font-bold text-background">{i18n.t(isSaving ? "loading" : "completeJuz")}</AppText></Pressable> : null}
              <Pressable disabled={isSaving} onPress={closeSheet} accessibilityRole="button" className="mt-3 items-center rounded-xl bg-surface px-4 py-3"><AppText className="font-bold text-foreground">{i18n.t("close")}</AppText></Pressable>
            </> : null}
          </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
