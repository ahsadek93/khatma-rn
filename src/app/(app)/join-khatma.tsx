import { AppText } from "@/components/AppText";
import { joinKhatmaByCode } from "@/features/khatma/api";
import { i18n } from "@/i18n";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";

export default function JoinKhatmaScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const normalizedCode = code;
  const isValidCode = /^[0-9A-F]{12}$/.test(normalizedCode);

  async function handleJoin() {
    if (!isValidCode || isJoining) return;
    setError(false);
    setIsJoining(true);
    try {
      const result = await joinKhatmaByCode(normalizedCode);
      if (result.error) {
        setError(true);
        return;
      }
      router.replace(result.data.type === "zikr" ? "/(app)/zikr" : "/(app)/home");
    } catch {
      setError(true);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow px-5 pb-8 pt-5">
        <Pressable accessibilityRole="button" onPress={() => router.back()} className="self-start py-2">
          <AppText className="text-base font-bold text-primary">{i18n.t("back")}</AppText>
        </Pressable>
        <View className="mt-8">
          <AppText className="text-3xl font-bold text-foreground">{i18n.t("joinKhatmaTitle")}</AppText>
          <AppText className="mt-2 text-base leading-7 text-secondary-foreground">{i18n.t("joinKhatmaDescription")}</AppText>
        </View>

        <View className="mt-8 rounded-3xl border border-subtle-border bg-surface p-5">
          <AppText className="mb-2 text-base font-bold text-foreground">{i18n.t("khatmaCodeLabel")}</AppText>
          <TextInput
            accessibilityLabel={i18n.t("khatmaCodeLabel")}
            value={code}
            onChangeText={(value) => { setCode(value.replace(/[^0-9a-f]/gi, "").toUpperCase()); setError(false); }}
            placeholder={i18n.t("khatmaCodePlaceholder")}
            placeholderTextColor="#8b978f"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            returnKeyType="done"
            onSubmitEditing={() => void handleJoin()}
            className="rounded-2xl border border-subtle-border bg-background px-4 py-3 text-base text-foreground"
          />
          {error ? <AppText accessibilityRole="alert" className="mt-3 text-sm text-red-500">{i18n.t("joinKhatmaError")}</AppText> : null}
        </View>

        <View className="mt-auto pt-8">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValidCode || isJoining, busy: isJoining }}
            disabled={!isValidCode || isJoining}
            onPress={() => void handleJoin()}
            className={`items-center rounded-2xl px-5 py-4 ${isValidCode && !isJoining ? "bg-primary" : "bg-primary/40"}`}
          >
            <AppText className="text-base font-bold text-background">{i18n.t(isJoining ? "loading" : "joinKhatmaButton")}</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
