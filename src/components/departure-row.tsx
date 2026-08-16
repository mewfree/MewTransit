import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { formatMinutes, hexColor, modeGlyph } from "@/lib/format";
import type { Departure } from "@/lib/types";

const LIVE_SYMBOL = {
  ios: "dot.radiowaves.left.and.right",
  android: "sensors",
  web: "sensors",
} as const;

function LiveIcon({ color, size }: { color: string; size: number }) {
  return (
    <SymbolView
      name={LIVE_SYMBOL}
      size={size}
      tintColor={color}
      weight="semibold"
      fallback={<View style={[styles.liveDot, { backgroundColor: color }]} />}
    />
  );
}

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
  const minutes = formatMinutes(departure.minutes);
  const etaColor = departure.realtime ? theme.live : theme.text;

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
      <View
        style={styles.eta}
        accessible
        accessibilityLabel={
          departure.realtime ? `${minutes}, live` : minutes
        }
      >
        <Text style={[styles.minutes, { color: etaColor }]}>{minutes}</Text>
        {departure.realtime ? (
          <LiveIcon color={theme.live} size={compact ? 12 : 14} />
        ) : null}
      </View>
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
  eta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  minutes: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
