import { View } from "react-native";

export function SkeletonBlock({ className }: { className: string }) {
  return <View className={`rounded-full bg-track ${className}`} />;
}
