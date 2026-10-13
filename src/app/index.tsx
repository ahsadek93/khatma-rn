import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { backend, isBackendConfigured } from "@/backend";

export default function Index() {
  const [destination, setDestination] = useState<"/(auth)/welcome" | "/(app)/home" | null>(
    isBackendConfigured ? null : "/(auth)/welcome",
  );

  useEffect(() => {
    let active = true;

    if (!backend) return;

    void backend.auth.getCurrentUser().then(({ data, error }) => {
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
