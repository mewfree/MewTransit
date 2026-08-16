import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

const Light = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F4F5F8",
    card: "#FFFFFF",
    text: "#111318",
    border: "#E4E6EE",
    primary: "#00A651",
  },
};

const Dark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#111318",
    card: "#1B1D24",
    text: "#F4F5F8",
    border: "#2A2D36",
    primary: "#82C341",
  },
};

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === "dark" ? Dark : Light}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="stop/[id]"
          options={{ title: "Stop", headerBackTitle: "Map" }}
        />
        <Stack.Screen name="about" options={{ title: "About" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
