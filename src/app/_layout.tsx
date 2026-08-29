import { Stack } from "expo-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initDatabase } from "../db/schema";

interface FontSizeContextValue {
  fontScale: number;
  setFontScale: (value: number) => void;
}

export const FontSizeContext = createContext<FontSizeContextValue>({
  fontScale: 1,
  setFontScale: () => {},
});

export function useFontSize() {
  return useContext(FontSizeContext);
}

export default function RootLayout() {
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    initDatabase();
  }, []);

  const value = useMemo(() => ({ fontScale, setFontScale }), [fontScale]);

  return (
    <FontSizeContext.Provider value={value}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </FontSizeContext.Provider>
  );
}
