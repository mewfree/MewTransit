import * as Linking from "expo-linking";
import { Link } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgencyColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { agencyLabel, formatDistance } from "@/lib/format";
import type { NearbyStop } from "@/lib/types";

import { DepartureRow } from "./departure-row";

export function NearbySheet({
  stops,
  error,
  loading,
  onRefresh,
}: {
  stops: NearbyStop[];
  error?: string | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: theme.sheet,
          borderColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={[styles.handle, { backgroundColor: theme.border }]} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Nearby</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {loading
              ? "Finding stops…"
              : `${stops.length} ${stops.length === 1 ? "stop" : "stops"} nearby`}
          </Text>
        </View>
        <Pressable onPress={onRefresh} hitSlop={12}>
          <Text style={[styles.refresh, { color: theme.text }]}>Refresh</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {stops.map((stop) => (
            <Link key={stop.id} href={`/stop/${encodeURIComponent(stop.id)}`} asChild>
              <Pressable
                style={StyleSheet.flatten([
                  styles.card,
                  { borderColor: theme.border },
                ])}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: AgencyColor[stop.agency] },
                    ]}
                  />
                  <Text style={[styles.stopName, { color: theme.text }]} numberOfLines={1}>
                    {stop.name}
                  </Text>
                  <Text style={[styles.distance, { color: theme.textSecondary }]}>
                    {formatDistance(stop.distanceM)}
                  </Text>
                </View>
                <Text style={[styles.agency, { color: theme.textSecondary }]}>
                  {agencyLabel(stop.agency)}
                  {stop.wheelchair ? " · Wheelchair accessible" : ""}
                </Text>
                {stop.departures.slice(0, 3).map((dep) => (
                  <DepartureRow key={dep.id} departure={dep} compact />
                ))}
              </Pressable>
            </Link>
          ))}
          {stops.length === 0 && !loading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No stops nearby. Move the map or wait for a location fix.
            </Text>
          ) : null}
        </ScrollView>
      )}
      <Text style={[styles.credit, { color: theme.textSecondary }]}>
        Map ©{" "}
        <Text
          style={styles.creditLink}
          onPress={() => void Linking.openURL("https://openfreemap.org")}
        >
          OpenFreeMap
        </Text>
        {" · "}
        <Text
          style={styles.creditLink}
          onPress={() => void Linking.openURL("https://www.openmaptiles.org/")}
        >
          OpenMapTiles
        </Text>
        {" · "}
        <Text
          style={styles.creditLink}
          onPress={() => void Linking.openURL("https://www.openstreetmap.org/copyright")}
        >
          OpenStreetMap
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "48%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    ...Platform.select({
      web: { boxShadow: "0 -8px 24px rgba(0,0,0,0.16)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  refresh: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stopName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
  },
  distance: {
    fontSize: 13,
  },
  agency: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 16,
  },
  empty: {
    paddingVertical: 24,
    textAlign: "center",
    fontSize: 15,
  },
  error: {
    color: "#C0392B",
    paddingVertical: 16,
    fontSize: 15,
  },
  credit: {
    fontSize: 11,
    marginTop: 8,
  },
  creditLink: {
    textDecorationLine: "underline",
  },
});
