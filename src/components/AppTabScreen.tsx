import { AppText } from "@/components/AppText";
import { AppTabs } from "@/components/AppTabs";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppTabScreen({
  active,
  title,
}: {
  active: "quran" | "zikr" | "settings";
  title: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View className="flex-1 items-center justify-center">
        <AppText className="text-4xl text-foreground">{title}</AppText>
      </View>
      <AppTabs active={active} />
    </SafeAreaView>
  );
}
