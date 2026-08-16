import * as Linking from "expo-linking";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

function CreditLink({
  href,
  children,
  color,
}: {
  href: string;
  children: string;
  color: string;
}) {
  return (
    <Text style={[styles.link, { color }]} onPress={() => void Linking.openURL(href)}>
      {children}
    </Text>
  );
}

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.mark, { color: theme.text }]}>MewTransit</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Montreal public transit on a map.
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Next departures at the closest STM, REM, and Exo stops.
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Map ©{" "}
        <CreditLink href="https://openfreemap.org" color={theme.text}>
          OpenFreeMap
        </CreditLink>
        {" · "}
        <CreditLink href="https://www.openmaptiles.org/" color={theme.text}>
          OpenMapTiles
        </CreditLink>
        {" · "}
        <CreditLink href="https://www.openstreetmap.org/copyright" color={theme.text}>
          OpenStreetMap
        </CreditLink>{" "}
        contributors.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    gap: 12,
    justifyContent: "center",
  },
  mark: {
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  link: {
    textDecorationLine: "underline",
  },
});
