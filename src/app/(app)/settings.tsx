import { AppText } from "@/components/AppText";
import {
  getCurrentProfile,
  saveCurrentDisplayName,
} from "@/features/profile/api";
import { signOut } from "@/features/auth/api";
import { i18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

export default function Settings() {
  const { theme, setTheme } = useSettings();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void getCurrentProfile()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMessage(i18n.t("profileLoadError"));
        if (data) {
          setDisplayName(data.displayName);
          setEmail(data.email);
        }
        setLoadingProfile(false);
      })
      .catch(() => {
        if (active) {
          setMessage(i18n.t("profileLoadError"));
          setLoadingProfile(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveName() {
    const name = displayName.trim();
    setMessage("");
    if (!name || name.length > 80) {
      setMessage(i18n.t("displayNameInvalid"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await saveCurrentDisplayName(name);
      setMessage(i18n.t(error ? "profileSaveError" : "profileSaved"));
      if (!error) setDisplayName(name);
    } catch {
      setMessage(i18n.t("profileSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setMessage("");
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        setMessage(i18n.t("signOutError"));
        return;
      }
      router.replace("/(auth)/welcome");
    } catch {
      setMessage(i18n.t("signOutError"));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-8" contentContainerStyle={{ paddingBottom: 32 }}>
      <AppText className="text-3xl font-bold text-foreground">
        {i18n.t("tabSettings")}
      </AppText>
      <AppText className="mb-3 mt-8 text-lg font-bold text-foreground">
        {i18n.t("profile")}
      </AppText>
      {!!email && (
        <AppText className="mb-3 text-secondary-foreground">{email}</AppText>
      )}
      <TextInput
        accessibilityLabel={i18n.t("displayName")}
        autoCapitalize="words"
        className="h-14 rounded-xl border border-foreground/20 bg-foreground/5 px-4 font-cairo text-base text-foreground"
        editable={!loadingProfile && !saving}
        maxLength={80}
        onChangeText={setDisplayName}
        placeholder={i18n.t("displayNamePlaceholder")}
        placeholderTextColor="#B8C9BC"
        value={displayName}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: loadingProfile || saving }}
        className="mt-3 min-h-12 items-center justify-center rounded-xl bg-primary"
        disabled={loadingProfile || saving}
        onPress={saveName}
      >
        <AppText className="text-base font-bold text-background">
          {i18n.t(saving ? "loading" : "save")}
        </AppText>
      </Pressable>
      {!!message && (
        <AppText accessibilityRole="alert" className="mt-2 text-foreground">
          {message}
        </AppText>
      )}
      <AppText className="mb-3 mt-8 text-lg font-bold text-foreground">
        {i18n.t("appearance")}
      </AppText>
      <View className="flex-row gap-3">
        {(["light", "dark"] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: theme === option }}
            onPress={() => setTheme(option)}
            className={`flex-1 items-center rounded-2xl border px-4 py-3 ${theme === option ? "border-primary bg-primary/15" : "border-primary/30"}`}
          >
            <AppText className="font-bold text-foreground">
              {i18n.t(option)}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: signingOut }}
        className="mt-10 min-h-12 items-center justify-center rounded-xl border border-primary/40"
        disabled={signingOut}
        onPress={handleSignOut}
      >
        <AppText className="text-base font-bold text-foreground">
          {i18n.t(signingOut ? "loading" : "logout")}
        </AppText>
      </Pressable>
    </ScrollView>
  );
}
