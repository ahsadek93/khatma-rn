import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function Index() {
  const [destination, setDestination] = useState<"/(auth)/welcome" | "/(app)/home" | null>(
    isSupabaseConfigured ? null : "/(auth)/welcome",
  );

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured || !supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setDestination(data.session ? "/(app)/home" : "/(auth)/welcome");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return destination ? <Redirect href={destination} /> : null;
}
