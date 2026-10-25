import { SkeletonBlock } from "@/components/SkeletonBlock";
import { View } from "react-native";

export function ZikrKhatmaDetailsSkeleton() {
  return (
    <>
      <View className="rounded-3xl border border-subtle-border bg-surface p-5">
        <View className="flex-row items-center justify-between">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-6 w-24" />
        </View>
        <SkeletonBlock className="mt-4 h-7 w-3/5" />
        <View className="mt-5 items-center gap-2">
          <SkeletonBlock className="h-6 w-4/5" />
          <SkeletonBlock className="h-6 w-3/5" />
        </View>
        <View className="mt-6 flex-row flex-wrap justify-between gap-x-4 gap-y-3">
          {[0, 1, 2, 3].map((item) => (
            <View key={item} className="gap-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-12" />
            </View>
          ))}
        </View>
        <SkeletonBlock className="mt-4 h-2 w-full" />
        <SkeletonBlock className="mt-3 h-4 w-28" />
        <SkeletonBlock className="mt-5 h-12 w-full rounded-2xl" />
      </View>
      <View className="mt-5 rounded-3xl border border-subtle-border bg-surface p-5">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="mt-2 h-4 w-32" />
        <SkeletonBlock className="mt-5 h-4 w-36" />
        <View className="mt-2 h-12 rounded-2xl border border-subtle-border bg-background" />
        <SkeletonBlock className="mt-3 h-12 w-full rounded-xl" />
      </View>
    </>
  );
}
