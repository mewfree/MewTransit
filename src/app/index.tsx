import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NearbySheet } from "@/components/nearby-sheet";
import { TransitMap } from "@/components/transit-map";
import { useTheme } from "@/hooks/use-theme";
import { fetchNearby } from "@/lib/api";
import { DOWNTOWN, isNearMontreal } from "@/lib/format";
import type { Coords, NearbyStop } from "@/lib/types";

export default function MapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [center, setCenter] = useState<Coords>(DOWNTOWN);
  const [user, setUser] = useState<Coords | null>(null);
  const [stops, setStops] = useState<NearbyStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (coords: Coords) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNearby(coords.lat, coords.lon);
      setStops(data.stops);
    } catch (err) {
      setError("Can't reach the transit API. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.status === "granted";
      if (!granted) {
        const asked = await Location.requestForegroundPermissionsAsync();
        granted = asked.status === "granted";
      }

      let coords = DOWNTOWN;
      if (granted) {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const here = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          };
          if (isNearMontreal(here.lat, here.lon)) {
            coords = here;
            if (!cancelled) setUser(here);
          }
        } catch {
          // stay on downtown montreal
        }
      }
      if (!cancelled) {
        setCenter(coords);
        await load(coords);
      }
    };

    void boot();
    return () => {
      cancelled = true;
      if (moveTimer.current) clearTimeout(moveTimer.current);
    };
  }, [load]);

  return (
    <View style={styles.root}>
      <TransitMap
        center={center}
        user={user}
        stops={stops}
        showsUser={user !== null}
        onSelect={(stop) => router.push(`/stop/${encodeURIComponent(stop.id)}`)}
        onMoveEnd={(coords) => {
          if (moveTimer.current) clearTimeout(moveTimer.current);
          moveTimer.current = setTimeout(() => {
            setCenter(coords);
            void load(coords);
          }, 350);
        }}
      />
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={[styles.pill, { backgroundColor: theme.sheet }]}>
          <Text style={[styles.brand, { color: theme.text }]}>MewTransit</Text>
        </View>
        <Link href="/about" asChild>
          <Pressable
            style={StyleSheet.flatten([
              styles.pill,
              { backgroundColor: theme.sheet },
            ])}
          >
            <Text style={[styles.brand, { color: theme.text }]}>About</Text>
          </Pressable>
        </Link>
      </View>
      <NearbySheet
        stops={stops}
        error={error}
        loading={loading}
        onRefresh={() => void load(center)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
  },
});
