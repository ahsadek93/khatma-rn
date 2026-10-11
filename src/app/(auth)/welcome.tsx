import { AppText } from "@/components/AppText";
import { i18n } from "@/i18n";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

const steps = [
  { title: "onboardingTitle1", body: "onboardingBody1" },
  { title: "onboardingTitle2", body: "onboardingBody2" },
  { title: "onboardingTitle3", body: "onboardingBody3" },
] as const;

export default function Welcome() {
  const [step, setStep] = useState(0);
  const isLastStep = step === steps.length - 1;

  return (
    <View className="flex-1 justify-between bg-background px-6 pb-8 pt-12">
      <View className="items-center">
        <View
          className="flex-row gap-2"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {steps.map((item, index) => (
            <View
              key={item.title}
              className={`h-1.5 rounded-full ${index === step ? "w-8 bg-primary" : "w-2 bg-foreground/20"}`}
            />
          ))}
        </View>
        <AppText className="mt-3 text-sm text-foreground">
          {step + 1} / {steps.length}
        </AppText>
      </View>

      <View className="items-center px-2">
        <Image
          accessibilityLabel={i18n.t("logoAlt")}
          contentFit="contain"
          source={require("../../../assets/images/logo.png")}
          style={{ width: 260, height: 142, marginBottom: 24 }}
        />
        <AppText className="text-center text-3xl text-foreground">
          {i18n.t(steps[step].title)}
        </AppText>
        <AppText className="mt-4 text-center text-lg leading-8 text-foreground">
          {i18n.t(steps[step].body)}
        </AppText>
      </View>

      <View className="gap-3">
        {isLastStep ? (
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="button"
              className="min-h-14 items-center justify-center rounded-2xl bg-primary px-6"
            >
              <AppText className="text-lg text-background">
                {i18n.t("onboardingLogin")}
              </AppText>
            </Pressable>
          </Link>
        ) : (
          <Pressable
            accessibilityRole="button"
            className="min-h-14 items-center justify-center rounded-2xl bg-primary px-6"
            onPress={() => setStep((current) => current + 1)}
          >
            <AppText className="text-lg text-background">
              {i18n.t("onboardingNext")}
            </AppText>
          </Pressable>
        )}
        {step > 0 && (
          <Pressable
            accessibilityRole="button"
            className="min-h-12 items-center justify-center"
            onPress={() => setStep((current) => current - 1)}
          >
            <AppText className="text-base text-foreground">
              {i18n.t("onboardingBack")}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
