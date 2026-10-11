import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

export default function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

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
                className="min-h-14 items-center justify-center rounded-xl bg-primary"
                onPress={() => setStep(2)}
              >
                <AppText className="text-lg text-background">
                  {i18n.t("continue")}
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
                  maxLength={6}
                  placeholder={i18n.t("signInCodePlaceholder")}
                  placeholderTextColor="#B8C9BC"
                  textAlign="center"
                  underlineColorAndroid="transparent"
                />
              </View>
              <Link href="/(app)/home" asChild>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-14 items-center justify-center rounded-xl bg-primary"
                >
                  <AppText className="text-lg text-background">
                    {i18n.t("login")}
                  </AppText>
                </Pressable>
              </Link>
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
        </View>
      </View>
    </ScrollView>
  );
}
