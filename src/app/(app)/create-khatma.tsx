import { AppText } from "@/components/AppText";
import { createKhatma } from "@/features/khatma/api";
import { i18n } from "@/i18n";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";

export default function CreateKhatmaScreen() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const trimmedName = name.trim();

  async function handleCreate() {
    if (!trimmedName || isSaving) return;
    setError("");
    setIsSaving(true);
    try {
      const result = await createKhatma(trimmedName);
      if (result.error) {
        setError(i18n.t("createKhatmaError"));
        return;
      }
      router.replace("/(app)/home");
    } catch {
      setError(i18n.t("createKhatmaError"));
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
          <AppText className="text-3xl font-bold text-foreground">{i18n.t("createKhatmaTitle")}</AppText>
          <AppText className="mt-2 text-base leading-7 text-secondary-foreground">{i18n.t("createKhatmaDescription")}</AppText>
        </View>

        <View className="mt-8 rounded-3xl border border-subtle-border bg-surface p-5">
          <AppText className="mb-2 text-base font-bold text-foreground">{i18n.t("khatmaNameLabel")}</AppText>
          <TextInput
            accessibilityLabel={i18n.t("khatmaNameLabel")}
            value={name}
            onChangeText={(value) => { setName(value); setError(""); }}
            placeholder={i18n.t("khatmaNamePlaceholder")}
            placeholderTextColor="#8b978f"
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={() => void handleCreate()}
            className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
          />
          {error ? <AppText accessibilityRole="alert" className="mt-3 text-sm text-red-500">{error}</AppText> : null}
        </View>

        <View className="mt-auto pt-8">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !trimmedName || isSaving, busy: isSaving }}
            disabled={!trimmedName || isSaving}
            onPress={() => void handleCreate()}
            className={`items-center rounded-2xl px-5 py-4 ${trimmedName && !isSaving ? "bg-primary" : "bg-primary/40"}`}
          >
            <AppText className="text-base font-bold text-background">{isSaving ? i18n.t("loading") : i18n.t("createKhatmaButton")}</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
