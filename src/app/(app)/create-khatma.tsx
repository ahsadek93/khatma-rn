import { AppText } from "@/components/AppText";
import { createKhatma, createZikrKhatma } from "@/features/khatma/api";
import type { KhatmaType } from "@/data/contracts";
import { i18n } from "@/i18n";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";

export default function CreateKhatmaScreen() {
  const { type: routeType } = useLocalSearchParams<{ type?: string }>();
  const type: KhatmaType = routeType === "zikr" ? "zikr" : "quran";
  const [name, setName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [goal, setGoal] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const trimmedName = name.trim();

  async function handleCreate() {
    if (!trimmedName || isSaving) return;
    setErrorKey("");
    if (type === "zikr") {
      if (!phrase.trim() || phrase.trim().length > 500) {
        setErrorKey("zikrPhraseInvalid");
        return;
      }
      if (!/^\d+$/.test(goal.trim()) || !Number.isSafeInteger(Number(goal)) || Number(goal) <= 0) {
        setErrorKey("zikrGoalInvalid");
        return;
      }
    }
    setIsSaving(true);
    try {
      const result = type === "zikr"
        ? await createZikrKhatma(trimmedName, phrase.trim(), Number(goal))
        : await createKhatma(trimmedName);
      if (result.error) {
        setErrorKey(type === "zikr" ? "createZikrKhatmaError" : "createKhatmaError");
        return;
      }
      router.replace(type === "zikr" ? "/(app)/zikr" : "/(app)/home");
    } catch {
      setErrorKey(type === "zikr" ? "createZikrKhatmaError" : "createKhatmaError");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow px-5 pb-8 pt-5">
        <Pressable accessibilityRole="button" onPress={() => router.back()} className="self-start py-2">
          <AppText className="text-base font-bold text-primary">{i18n.t("back")}</AppText>
        </Pressable>
        <View className="mt-8">
          <AppText className="text-3xl font-bold text-foreground">{i18n.t(type === "zikr" ? "createZikrKhatmaTitle" : "createKhatmaTitle")}</AppText>
          <AppText className="mt-2 text-base leading-7 text-secondary-foreground">{i18n.t(type === "zikr" ? "createZikrKhatmaDescription" : "createKhatmaDescription")}</AppText>
        </View>

        <View className="mt-8 rounded-3xl border border-subtle-border bg-surface p-5">
          <AppText className="mb-2 text-base font-bold text-foreground">{i18n.t("khatmaNameLabel")}</AppText>
          <TextInput
            accessibilityLabel={i18n.t("khatmaNameLabel")}
            value={name}
            onChangeText={(value) => { setName(value); setErrorKey(""); }}
            placeholder={i18n.t("khatmaNamePlaceholder")}
            placeholderTextColor="#8b978f"
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={() => void handleCreate()}
            className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
          />
          {type === "zikr" ? <>
            <AppText className="mb-2 mt-5 text-base font-bold text-foreground">{i18n.t("zikrPhraseLabel")}</AppText>
            <TextInput
              accessibilityLabel={i18n.t("zikrPhraseLabel")}
              value={phrase}
              onChangeText={(value) => { setPhrase(value); setErrorKey(""); }}
              placeholder={i18n.t("zikrPhrasePlaceholder")}
              placeholderTextColor="#8b978f"
              maxLength={500}
              returnKeyType="next"
              className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
            />
            <AppText className="mb-2 mt-5 text-base font-bold text-foreground">{i18n.t("zikrGoalLabel")}</AppText>
            <TextInput
              accessibilityLabel={i18n.t("zikrGoalLabel")}
              value={goal}
              onChangeText={(value) => { setGoal(value.replace(/[^0-9]/g, "")); setErrorKey(""); }}
              placeholder={i18n.t("zikrGoalPlaceholder")}
              placeholderTextColor="#8b978f"
              keyboardType="number-pad"
              maxLength={16}
              returnKeyType="done"
              className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
            />
          </> : null}
          {errorKey ? <AppText accessibilityRole="alert" className="mt-3 text-sm text-red-500">{i18n.t(errorKey)}</AppText> : null}
        </View>

        <View className="mt-auto pt-8">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !trimmedName || isSaving, busy: isSaving }}
            disabled={!trimmedName || isSaving}
            onPress={() => void handleCreate()}
            className={`items-center rounded-2xl px-5 py-4 ${trimmedName && !isSaving ? "bg-primary" : "bg-primary/40"}`}
          >
            <AppText className="text-base font-bold text-background">{isSaving ? i18n.t("loading") : i18n.t(type === "zikr" ? "createZikrKhatmaButton" : "createKhatmaButton")}</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
