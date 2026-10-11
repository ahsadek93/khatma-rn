import { AppText } from "@/components/AppText";
import { View } from "react-native";

export function AuthScreen({ title }: { title: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <AppText className="text-4xl text-foreground">{title}</AppText>
    </View>
  );
}
