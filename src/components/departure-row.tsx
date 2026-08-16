import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { formatMinutes, hexColor, modeGlyph } from "@/lib/format";
import type { Departure } from "@/lib/types";

export function DepartureRow({
  departure,
  compact = false,
}: {
  departure: Departure;
  compact?: boolean;
}) {
  const theme = useTheme();
  const bg = hexColor(departure.routeColor);
  const fg = hexColor(departure.routeTextColor || "FFFFFF");

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: fg }]}>
          {modeGlyph(departure.mode)} {departure.routeShortName}
        </Text>
      </View>
      {!compact ? (
        <Text
          style={[styles.headsign, { color: theme.text }]}
          numberOfLines={1}
        >
          {departure.headsign}
        </Text>
      ) : null}
      <Text style={[styles.minutes, { color: theme.text }]}>
        {formatMinutes(departure.minutes)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 52,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headsign: {
    flex: 1,
    fontSize: 15,
  },
  minutes: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
