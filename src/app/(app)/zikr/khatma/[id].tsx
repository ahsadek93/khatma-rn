import { AppText } from "@/components/AppText";
import { subscribeToKhatmaUpdates } from "@/data";
import { getCurrentUser } from "@/features/auth/api";
import { getKhatmaJoinCode, getKhatmaMembers, type KhatmaMember } from "@/features/khatma/api";
import {
  completeZikrClaim,
  getKhatmaZikrProgress,
  releaseZikrClaim,
  setZikrClaim,
  updateZikrKhatmaSettings,
  type ZikrKhatmaProgress,
} from "@/features/zikr/api";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
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
  const [progress, setProgress] = useState<ZikrKhatmaProgress | null>(null);
  const [members, setMembers] = useState<KhatmaMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<KhatmaStatus>(status === "completed" ? "completed" : "active");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [joinCodeError, setJoinCodeError] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");
  const [phraseDraft, setPhraseDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const loadRef = useRef<(() => Promise<void>) | null>(null);
  const isOwner = members.some((member) => member.userId === currentUserId && member.role === "owner");
  const isCompleted = currentStatus === "completed";
  const freeCount = progress ? Math.max(0, progress.goalCount - progress.completedCount - progress.pendingCount) : 0;

  useFocusEffect(useCallback(() => {
    let current = true;
    let initialized = false;
    const load = async () => {
      try {
        const [progressResult, membersResult, userResult] = await Promise.all([
          getKhatmaZikrProgress(id),
          getKhatmaMembers(id),
          getCurrentUser(),
        ]);
        if (!current) return;
        if (progressResult.error || membersResult.error || userResult.error || !userResult.data) {
          setLoadError(true);
          setIsLoading(false);
          return;
        }
        setProgress(progressResult.data);
        setMembers(membersResult.data);
        setCurrentUserId(userResult.data.id);
        setCurrentStatus(status === "completed" || progressResult.data.completedCount >= progressResult.data.goalCount ? "completed" : "active");
        setLoadError(false);
        if (!initialized) {
          setClaimAmount(String(progressResult.data.myPendingCount || ""));
          setPhraseDraft(progressResult.data.phrase);
          setGoalDraft(String(progressResult.data.goalCount));
          initialized = true;
        }
        setIsLoading(false);

        if (status !== "completed") {
          const codeResult = await getKhatmaJoinCode(id);
          if (!current) return;
          if (codeResult.error || !codeResult.data) setJoinCodeError(true);
          else {
            setJoinCode(codeResult.data);
            setJoinCodeError(false);
          }
        }
      } catch {
        if (current) setLoadError(true);
      } finally {
        if (current) setIsLoading(false);
      }
    };

    loadRef.current = load;
    void load();
    const refreshLiveDetails = async () => {
      try {
        const [progressResult, membersResult] = await Promise.all([
          getKhatmaZikrProgress(id),
          getKhatmaMembers(id),
        ]);
        if (!current) return;
        if (progressResult.error || membersResult.error) {
          setLoadError(true);
          return;
        }
        setProgress(progressResult.data);
        setMembers(membersResult.data);
        setCurrentStatus(status === "completed" || progressResult.data.completedCount >= progressResult.data.goalCount ? "completed" : "active");
        setLoadError(false);
      } catch {
        if (current) setLoadError(true);
      }
    };
    const unsubscribe = status === "completed" ? () => {} : subscribeToKhatmaUpdates(id, "zikr", (event) => {
      if (event === "completed") {
        setCurrentStatus("completed");
        void refreshLiveDetails();
      }
      else if (event !== "connected") void refreshLiveDetails();
    });
    return () => {
      current = false;
      loadRef.current = null;
      unsubscribe();
    };
  }, [id, status]));

  async function handleSaveClaim() {
    const amount = Number(claimAmount);
    if (!/^\d+$/.test(claimAmount.trim()) || !Number.isSafeInteger(amount) || amount <= 0) {
      setActionError("zikrClaimAmountInvalid");
      return;
    }
    setIsSaving(true);
    setActionError("");
    try {
      const result = await setZikrClaim(id, amount);
      if (result.error) setActionError("zikrClaimError");
      else {
        setClaimAmount(String(amount));
        void loadRef.current?.();
      }
    } catch {
      setActionError("zikrClaimError");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReleaseClaim() {
    setIsSaving(true);
    setActionError("");
    try {
      const result = await releaseZikrClaim(id);
      if (result.error) setActionError("zikrReleaseError");
      else {
        setClaimAmount("");
        void loadRef.current?.();
      }
    } catch {
      setActionError("zikrReleaseError");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompleteClaim() {
    setIsSaving(true);
    setActionError("");
    try {
      const result = await completeZikrClaim(id);
      if (result.error) setActionError("zikrCompleteError");
      else {
        setClaimAmount("");
        void loadRef.current?.();
      }
    } catch {
      setActionError("zikrCompleteError");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSettings() {
    const goal = Number(goalDraft);
    if (!phraseDraft.trim() || phraseDraft.trim().length > 500) {
      setActionError("zikrPhraseInvalid");
      return;
    }
    if (!/^\d+$/.test(goalDraft.trim()) || !Number.isSafeInteger(goal) || goal <= 0) {
      setActionError("zikrGoalInvalid");
      return;
    }
    if (goal < (progress?.goalCount ?? 0)) {
      setActionError("zikrGoalCannotDecrease");
      return;
    }
    setIsSaving(true);
    setActionError("");
    try {
      const result = await updateZikrKhatmaSettings(id, phraseDraft.trim(), goal);
      if (result.error) setActionError("zikrSettingsError");
      else {
        setPhraseDraft(phraseDraft.trim());
        setGoalDraft(String(goal));
        void loadRef.current?.();
      }
    } catch {
      setActionError("zikrSettingsError");
    } finally {
      setIsSaving(false);
    }
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

        {isLoading ? <AppText className="mt-8 text-center text-secondary-foreground">{i18n.t("loading")}</AppText> : loadError || !progress ? (
          <View className="rounded-3xl border border-subtle-border bg-surface p-5">
            <AppText className="text-sm text-secondary-foreground">{i18n.t("zikrDetailsLoadError")}</AppText>
            <Pressable accessibilityRole="button" onPress={() => { setIsLoading(true); void loadRef.current?.(); }} className="mt-3 self-start">
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
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving || (freeCount === 0 && progress.myPendingCount === 0) }} disabled={isSaving || (freeCount === 0 && progress.myPendingCount === 0)} onPress={() => void handleSaveClaim()} className="mt-3 items-center rounded-xl bg-primary px-4 py-3">
              <AppText className="font-bold text-background">{i18n.t(isSaving ? "loading" : progress.myPendingCount ? "updateZikrClaim" : "claimZikrAmount")}</AppText>
            </Pressable>
            {progress.myPendingCount > 0 ? <View className="mt-3 flex-row gap-3">
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving }} disabled={isSaving} onPress={() => void handleReleaseClaim()} className="flex-1 items-center rounded-xl border border-primary/40 px-3 py-3">
                <AppText className="font-bold text-primary">{i18n.t("releaseZikrClaim")}</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving }} disabled={isSaving} onPress={() => void handleCompleteClaim()} className="flex-1 items-center rounded-xl bg-primary/15 px-3 py-3">
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
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: isSaving }} disabled={isSaving} onPress={() => void handleSaveSettings()} className="mt-4 items-center rounded-xl bg-primary px-4 py-3">
              <AppText className="font-bold text-background">{i18n.t(isSaving ? "loading" : "saveZikrSettings")}</AppText>
            </Pressable>
          </View> : null}

          {actionError ? <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-subtle-border bg-surface p-4">
            <AppText accessibilityRole="alert" className="flex-1 text-sm text-red-500">{i18n.t(actionError)}</AppText>
            {actionError === "zikrClaimError" ? <Pressable accessibilityRole="button" onPress={() => { setActionError(""); void loadRef.current?.(); }} className="ml-3"><AppText className="font-bold text-primary">{i18n.t("refresh")}</AppText></Pressable> : null}
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
