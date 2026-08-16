import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { DepartureRow } from "@/components/departure-row";
import { AgencyColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchStopDepartures } from "@/lib/api";
import { agencyLabel } from "@/lib/format";
import type { Departure, StopDeparturesResponse } from "@/lib/types";

export default function StopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const theme = useTheme();
  const [data, setData] = useState<StopDeparturesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchStopDepartures(id)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        navigation.setOptions({ title: res.stop.name });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError("Couldn't load this stop.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigation]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View
          style={[
            styles.agency,
            { backgroundColor: AgencyColor[data.stop.agency] },
          ]}
        >
          <Text style={styles.agencyText}>{agencyLabel(data.stop.agency)}</Text>
        </View>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {data.stop.wheelchair ? "Wheelchair accessible" : "Upcoming departures"}
        </Text>
      </View>
      <FlatList
        data={data.departures}
        keyExtractor={(item: Departure) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <DepartureRow departure={item} />}
        ListEmptyComponent={
          <Text style={{ color: theme.textSecondary }}>No more departures</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  agency: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agencyText: {
    color: "#fff",
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 6,
  },
});
