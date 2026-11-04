import { Redirect } from "expo-router";
import { useMe } from "@/features/profile/api";

export default function Index() {
  const { data, isPending } = useMe();
  if (isPending) return null;
  return <Redirect href={data ? "/(app)/home" : "/(auth)/welcome"} />;
}
