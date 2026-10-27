import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { getCurrentUser } from "@/features/auth/api";

export default function Index() {
  const [destination, setDestination] = useState<"/(auth)/welcome" | "/(app)/home" | null>(null);

  useEffect(() => {
    let active = true;

    void getCurrentUser().then(({ data, error }) => {
      if (active) {
        setDestination(!error && data ? "/(app)/home" : "/(auth)/welcome");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return destination ? <Redirect href={destination} /> : null;
}
