import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "@/stores/settings";
import { useUnstableNativeVariable } from "nativewind";
import { Platform } from "react-native";

export default function AuthLayout() {
  useSettings();
  const nativeBackground = useUnstableNativeVariable("--color-background");
  const backgroundColor = Platform.select({ web: "var(--color-background)", default: nativeBackground });
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
        }}
      />
    </SafeAreaView>
  );
}
