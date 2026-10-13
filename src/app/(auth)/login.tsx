import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { sendSignInCode, verifySignInCode } from "@/features/auth/api";
import { isBackendConfigured } from "@/data";

export default function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  async function requestCode() {
    setMessage("");
    if (!isBackendConfigured) {
      setMessage(i18n.t("authNotConfigured"));
      return;
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage(i18n.t("invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendSignInCode(normalizedEmail);
      if (error) {
        setMessage(i18n.t("authRequestError"));
        return;
      }
      setStep(2);
      setMessage(i18n.t("signInCodeSent"));
    } catch {
      setMessage(i18n.t("authRequestError"));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    setMessage("");
    if (!/^\d{8}$/.test(code)) {
      setMessage(i18n.t("invalidCode"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifySignInCode(normalizedEmail, code);
      if (error) {
        setMessage(i18n.t("authVerifyError"));
        return;
      }
      router.replace("/(app)/home");
    } catch {
      setMessage(i18n.t("authVerifyError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-10">
        <Image
          accessibilityLabel={i18n.t("logoAlt")}
          contentFit="contain"
          source={require("../../../assets/images/logo.png")}
          style={{
            width: 220,
            height: 120,
            alignSelf: "center",
            marginBottom: 20,
          }}
        />
        <View className="flex-row justify-center gap-2">
          <View
            className={`h-1.5 rounded-full ${step === 1 ? "w-8 bg-primary" : "w-2 bg-foreground/20"}`}
          />
          <View
            className={`h-1.5 rounded-full ${step === 2 ? "w-8 bg-primary" : "w-2 bg-foreground/20"}`}
          />
        </View>
        <AppText className="mt-3 text-center text-sm text-foreground">
          {step} / 2
        </AppText>
        <AppText className="text-center text-3xl text-foreground">
          {i18n.t(step === 1 ? "login" : "signInCodeLabel")}
        </AppText>
        <AppText className="mt-3 text-center text-base leading-7 text-foreground">
          {i18n.t(step === 1 ? "loginDescription" : "signInCodeDescription")}
        </AppText>

        <View className="mt-10 gap-6">
          {step === 1 ? (
            <>
              <View>
                <AppText className="mb-2 text-base text-foreground">
                  {i18n.t("emailLabel")}
                </AppText>
                <TextInput
                  accessibilityLabel={i18n.t("emailLabel")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="h-14 rounded-xl border border-foreground/20 bg-foreground/5 px-4 font-cairo text-base text-foreground"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder={i18n.t("emailPlaceholder")}
                  placeholderTextColor="#B8C9BC"
                  textAlign="left"
                  underlineColorAndroid="transparent"
                  value={email}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                className="min-h-14 items-center justify-center rounded-xl bg-primary"
                disabled={loading}
                onPress={requestCode}
              >
                <AppText className="text-lg text-background">
                  {i18n.t(loading ? "loading" : "continue")}
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              <View>
                <AppText className="mb-2 text-base text-foreground">
                  {i18n.t("signInCodeLabel")}
                </AppText>
                <TextInput
                  accessibilityLabel={i18n.t("signInCodeLabel")}
                  className="h-14 rounded-xl border border-foreground/20 bg-foreground/5 px-4 font-cairo text-base tracking-[0.3em] text-foreground"
                  keyboardType="number-pad"
                  maxLength={8}
                  onChangeText={setCode}
                  placeholder={i18n.t("signInCodePlaceholder")}
                  placeholderTextColor="#B8C9BC"
                  textAlign="center"
                  underlineColorAndroid="transparent"
                  value={code}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                className="min-h-14 items-center justify-center rounded-xl bg-primary"
                disabled={loading}
                onPress={submitCode}
              >
                <AppText className="text-lg text-background">
                  {i18n.t(loading ? "loading" : "login")}
                </AppText>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={loading} onPress={requestCode}>
                <AppText className="text-center text-base text-foreground">
                  {i18n.t("resendCode")}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="min-h-12 items-center justify-center"
                onPress={() => setStep(1)}
              >
                <AppText className="text-base text-foreground">
                  {i18n.t("onboardingBack")}
                </AppText>
              </Pressable>
            </>
          )}
          {!!message && (
            <AppText accessibilityRole="alert" className="text-center text-base text-foreground">
              {message}
            </AppText>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
