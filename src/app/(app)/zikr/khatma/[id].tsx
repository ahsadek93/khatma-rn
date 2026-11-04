import { AppText } from "@/components/AppText";
import { useKhatmaRealtime } from "@/features/khatma/realtime";
import { useMe } from "@/features/profile/api";
import { useKhatmaInvite, useKhatmaMembers } from "@/features/khatma/api";
import {
  useCompleteZikrClaim,
  useReleaseZikrClaim,
  useSetZikrClaim,
  useUpdateZikrSettings,
  useZikrProgress,
} from "@/features/zikr/api";
import { i18n } from "@/i18n";
import { ZikrKhatmaDetailsSkeleton } from "@/features/zikr/components/ZikrKhatmaDetailsSkeleton";
import { useSettings } from "@/stores/settings";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, TextInput, View } from "react-native";

type KhatmaStatus = "active" | "completed";

export default function ZikrKhatmaDetails() {
  useSettings();
  const { id, name, status, completedAt } = useLocalSearchParams<{
    id: string;
    name?: string;
    status?: KhatmaStatus;
    completedAt?: string;
  }>();
  const progressQuery = useZikrProgress(id);
  const membersQuery = useKhatmaMembers(id);
  const invite = useKhatmaInvite(id, status === "active");
  const progress = progressQuery.data ?? null;
  const members = membersQuery.data ?? [];
  const currentUserId = useMe().data?.id ?? null;
  const joinCode = invite.data ?? null;
  const joinCodeError = invite.isError || (invite.isSuccess && !invite.data);
  const [shareError, setShareError] = useState(false);
  const isLoading = progressQuery.isPending || membersQuery.isPending;
  const loadError = progressQuery.isLoadingError || membersQuery.isLoadingError;
  const [actionError, setActionError] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [phraseDraft, setPhraseDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const initialized = useRef(false);
  const isOwner = members.some((member) => member.userId === currentUserId && member.role === "owner");
  const isCompleted = status === "completed" || (progress !== null && progress.completedCount >= progress.goalCount);
  const freeCount = progress ? Math.max(0, progress.goalCount - progress.completedCount - progress.pendingCount) : 0;
  useKhatmaRealtime(status === "completed" ? [] : [id]);

  useEffect(() => {
    if (!progress || initialized.current || progressQuery.isFetching) return;
    initialized.current = true;
    setClaimAmount(String(progress.myPendingCount || ""));
    setPhraseDraft(progress.phrase);
    setGoalDraft(String(progress.goalCount));
  }, [progress, progressQuery.isFetching]);

  const claim = useSetZikrClaim(id);
  const release = useReleaseZikrClaim(id);
  const complete = useCompleteZikrClaim(id);
  const saveSettings = useUpdateZikrSettings(id);
  const isSaving = claim.isPending || release.isPending || complete.isPending || saveSettings.isPending;

  function handleSaveClaim() {
    const amount = Number(claimAmount);
    if (!/^[0-9]+$/.test(claimAmount.trim()) || !Number.isSafeInteger(amount) || amount <= 0) {
      setActionError("zikrClaimAmountInvalid");
      return;
    }
    setActionError("");
    claim.mutate(amount, { onSuccess: () => setClaimAmount(String(amount)), onError: () => setActionError("zikrClaimError") });
  }

  function handleReleaseClaim() {
    setActionError("");
    release.mutate(undefined, { onSuccess: () => setClaimAmount(""), onError: () => setActionError("zikrReleaseError") });
  }

  function handleCompleteClaim() {
    setActionError("");
    complete.mutate(undefined, { onSuccess: () => setClaimAmount(""), onError: () => setActionError("zikrCompleteError") });
  }

  function handleSaveSettings() {
    const goal = Number(goalDraft);
    if (!phraseDraft.trim() || phraseDraft.trim().length > 500) {
      setActionError("zikrPhraseInvalid");
      return;
    }
    if (!/^[0-9]+$/.test(goalDraft.trim()) || !Number.isSafeInteger(goal) || goal <= 0) {
      setActionError("zikrGoalInvalid");
      return;
    }
    if (goal < (progress?.goalCount ?? 0)) {
      setActionError("zikrGoalCannotDecrease");
      return;
    }
    setActionError("");
    const phrase = phraseDraft.trim();
    saveSettings.mutate({ phrase, goal }, {
      onSuccess: () => { setPhraseDraft(phrase); setGoalDraft(String(goal)); },
      onError: () => setActionError("zikrSettingsError"),
    });
  }

  function handleShare() {
    if (!joinCode) return;
    setShareError(false);
    void Share.share({ message: i18n.t("shareKhatmaMessage", { name: name ?? "", code: joinCode }) ?? "" })
      .catch(() => setShareError(true));
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-5">
        <Pressable onPress={() => router.back()} className="mb-5 self-start rounded-full bg-surface px-4 py-2" accessibilityRole="button">
          <AppText className="font-bold text-primary">{`‹  ${i18n.t("back")}`}</AppText>
        </Pressable>

        {isLoading ? <ZikrKhatmaDetailsSkeleton /> : loadError || !progress ? (
          <View className="rounded-3xl border border-subtle-border bg-surface p-5">
            <AppText className="text-sm text-secondary-foreground">{i18n.t("zikrDetailsLoadError")}</AppText>
            <Pressable accessibilityRole="button" onPress={() => { void progressQuery.refetch(); void membersQuery.refetch(); }} className="mt-3 self-start">
              <AppText className="font-bold text-primary">{i18n.t("refresh")}</AppText>
            </Pressable>
          </View>
        ) : <>
          <View className="rounded-3xl border border-subtle-border bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <AppText className="text-sm font-bold text-primary">{i18n.t("zikrKhatmaDetails")}</AppText>
              <View className="rounded-full bg-primary/15 px-3 py-1">
                <AppText className="text-xs font-bold text-primary">{i18n.t(isCompleted ? "completedBadge" : "inProgress")}</AppText>
              </View>
            </View>
            <AppText className="mt-4 text-2xl font-bold text-foreground">{name}</AppText>
            <AppText className="mt-5 text-center text-2xl leading-10 text-foreground">{progress.phrase}</AppText>
            {isCompleted && completedAt ? <AppText className="mt-3 text-sm text-secondary-foreground">{i18n.t("khatmaCompletedAt", { date: new Date(completedAt).toLocaleDateString(i18n.locale) })}</AppText> : null}
            <View className="mt-6 flex-row flex-wrap justify-between gap-y-3">
              <Count label={i18n.t("zikrCompleted")} value={progress.completedCount} />
              <Count label={i18n.t("zikrPending")} value={progress.pendingCount} />
              <Count label={i18n.t("zikrFree")} value={freeCount} />
              <Count label={i18n.t("zikrGoalLabel")} value={progress.goalCount} />
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-track">
              <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (progress.completedCount / progress.goalCount) * 100)}%` }} />
            </View>
            <AppText className="mt-2 text-sm text-secondary-foreground">{i18n.t("activeGroupMembers", { count: members.length })}</AppText>
            {!isCompleted ? joinCode ? (
              <Pressable onPress={handleShare} accessibilityRole="button" className="mt-5 items-center rounded-2xl bg-primary px-4 py-3">
                <AppText className="font-bold text-background">{i18n.t("shareKhatma")}</AppText>
              </Pressable>
            ) : joinCodeError ? <AppText className="mt-4 text-sm text-secondary-foreground">{i18n.t("khatmaCodeLoadError")}</AppText> : null : null}
            {shareError ? <AppText accessibilityRole="alert" className="mt-3 text-sm text-red-500">{i18n.t("shareKhatmaError")}</AppText> : null}
          </View>

          {!isCompleted ? <View className="mt-5 rounded-3xl border border-subtle-border bg-surface p-5">
            <AppText className="text-lg font-bold text-foreground">{i18n.t("myZikrClaim")}</AppText>
            <AppText className="mt-1 text-sm text-secondary-foreground">{i18n.t("myZikrClaimValue", { count: progress.myPendingCount })}</AppText>
            {freeCount === 0 && progress.myPendingCount === 0 ? <AppText className="mt-3 text-sm text-secondary-foreground">{i18n.t("zikrNoFreeCount")}</AppText> : null}
            <AppText className="mb-2 mt-5 text-sm font-bold text-foreground">{i18n.t("zikrClaimAmountLabel")}</AppText>
            <TextInput
              accessibilityLabel={i18n.t("zikrClaimAmountLabel")}
              value={claimAmount}
              onChangeText={(value) => { setClaimAmount(value.replace(/[^0-9]/g, "")); setActionError(""); }}
              keyboardType="number-pad"
              maxLength={16}
              placeholder={i18n.t("zikrClaimAmountPlaceholder")}
              placeholderTextColor="#8b978f"
              editable={!isSaving}
              className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
            />
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving || (freeCount === 0 && progress.myPendingCount === 0) }} disabled={isSaving || (freeCount === 0 && progress.myPendingCount === 0)} onPress={() => handleSaveClaim()} className="mt-3 items-center rounded-xl bg-primary px-4 py-3">
              <AppText className="font-bold text-background">{i18n.t(isSaving ? "loading" : progress.myPendingCount ? "updateZikrClaim" : "claimZikrAmount")}</AppText>
            </Pressable>
            {progress.myPendingCount > 0 ? <View className="mt-3 flex-row gap-3">
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving }} disabled={isSaving} onPress={() => handleReleaseClaim()} className="flex-1 items-center rounded-xl border border-primary/40 px-3 py-3">
                <AppText className="font-bold text-primary">{i18n.t("releaseZikrClaim")}</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving }} disabled={isSaving} onPress={() => handleCompleteClaim()} className="flex-1 items-center rounded-xl bg-primary/15 px-3 py-3">
                <AppText className="font-bold text-primary">{i18n.t("completeZikrClaim")}</AppText>
              </Pressable>
            </View> : null}
          </View> : null}

          {isOwner && !isCompleted ? <View className="mt-5 rounded-3xl border border-subtle-border bg-surface p-5">
            <AppText className="text-lg font-bold text-foreground">{i18n.t("editZikrSettings")}</AppText>
            <AppText className="mb-2 mt-4 text-sm font-bold text-foreground">{i18n.t("zikrPhraseLabel")}</AppText>
            <TextInput
              accessibilityLabel={i18n.t("zikrPhraseLabel")}
              value={phraseDraft}
              onChangeText={(value) => { setPhraseDraft(value); setActionError(""); }}
              maxLength={500}
              editable={!isSaving}
              className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
            />
            <AppText className="mb-2 mt-4 text-sm font-bold text-foreground">{i18n.t("zikrGoalLabel")}</AppText>
            <TextInput
              accessibilityLabel={i18n.t("zikrGoalLabel")}
              value={goalDraft}
              onChangeText={(value) => { setGoalDraft(value.replace(/[^0-9]/g, "")); setActionError(""); }}
              keyboardType="number-pad"
              maxLength={16}
              editable={!isSaving}
              className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
            />
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving }} disabled={isSaving} onPress={() => handleSaveSettings()} className="mt-4 items-center rounded-xl bg-primary px-4 py-3">
              <AppText className="font-bold text-background">{i18n.t(isSaving ? "loading" : "saveZikrSettings")}</AppText>
            </Pressable>
          </View> : null}

          {actionError ? <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-subtle-border bg-surface p-4">
            <AppText accessibilityRole="alert" className="flex-1 text-sm text-red-500">{i18n.t(actionError)}</AppText>
            {actionError === "zikrClaimError" ? <Pressable accessibilityRole="button" onPress={() => { setActionError(""); void progressQuery.refetch(); }} className="ml-3"><AppText className="font-bold text-primary">{i18n.t("refresh")}</AppText></Pressable> : null}
          </View> : null}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <AppText className="text-xs text-secondary-foreground">{label}</AppText>
      <AppText className="mt-1 text-lg font-bold text-foreground">{value.toLocaleString(i18n.locale)}</AppText>
    </View>
  );
}
