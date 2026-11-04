import { focusManager, QueryCache, QueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { AppState, Platform } from "react-native";
import type { BackendError } from "./contracts";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: BackendError;
  }
}

// Web already refetches on browser focus; on native, mirror AppState.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => focusManager.setFocused(status === "active"));
}

export const queryClient = new QueryClient({
  // http.ts already cleared the session when the refresh failed; just leave.
  queryCache: new QueryCache({
    onError: (error) => {
      if (error.code !== "unauthenticated") return;
      queryClient.clear();
      router.replace("/(auth)/welcome");
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => error.code === "unavailable" && failureCount < 2,
    },
  },
});
