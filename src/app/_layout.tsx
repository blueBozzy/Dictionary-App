import { Stack } from "expo-router";
import { initDatabase } from "../db/schema";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);
  
  return (
  <Stack>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  </Stack>
  );
}
