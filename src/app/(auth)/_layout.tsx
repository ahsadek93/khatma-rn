import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#14271c" },
        }}
      />
    </SafeAreaView>
  );
}
