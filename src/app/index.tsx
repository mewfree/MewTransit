import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NearbySheet } from "@/components/nearby-sheet";
import { TransitMap } from "@/components/transit-map";
import { useTheme } from "@/hooks/use-theme";
import { fetchNearby, overlayRealtimeNearby } from "@/lib/api";
import { DOWNTOWN, isNearMontreal } from "@/lib/format";
import { isPackOpen, openActivePack } from "@/lib/pack/db";
import { syncPack, type PackSyncProgress } from "@/lib/pack/sync";
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
  const [packStatus, setPackStatus] = useState<string | null>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerRef = useRef(center);
  centerRef.current = center;

  const loadGen = useRef(0);

  const load = useCallback(async (coords: Coords) => {
    const gen = ++loadGen.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNearby(coords.lat, coords.lon);
      if (gen !== loadGen.current) return;
      setStops(data.stops);
      setLoading(false);
      const painted = await overlayRealtimeNearby(data);
      if (gen !== loadGen.current) return;
      setStops(painted.stops);
    } catch {
      if (gen !== loadGen.current) return;
      setError(
        isPackOpen()
          ? "Couldn't read the city pack."
          : "City pack isn't on this device yet.",
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const onPackProgress = (p: PackSyncProgress) => {
      if (cancelled) return;
      if (p.phase === "downloading" || (p.phase === "checking" && p.message)) {
        setPackStatus(p.message);
      } else if (p.phase === "error") {
        setPackStatus(p.message);
      } else if (p.phase === "ready") {
        setPackStatus(null);
      }
    };

    const locate = async (): Promise<Coords> => {
      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.status === "granted";
      if (!granted) {
        const asked = await Location.requestForegroundPermissionsAsync();
        granted = asked.status === "granted";
      }
      if (!granted) return DOWNTOWN;
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const here = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        if (isNearMontreal(here.lat, here.lon)) {
          if (!cancelled) setUser(here);
          return here;
        }
      } catch {
        // stay on downtown montreal
      }
      return DOWNTOWN;
    };

    const runSync = async () => {
      const result = await syncPack(onPackProgress);
      if (cancelled) return;
      if (isPackOpen()) {
        await load(centerRef.current);
      } else if (!result.opened) {
        setError("City pack isn't on this device yet.");
        setLoading(false);
      }
    };

    const boot = async () => {
      const coords = await locate();
      if (cancelled) return;
      setCenter(coords);
      await openActivePack();
      if (cancelled) return;
      if (isPackOpen()) {
        await load(coords);
      }
      await runSync();
    };

    void boot();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runSync();
    });
    return () => {
      cancelled = true;
      if (moveTimer.current) clearTimeout(moveTimer.current);
      sub.remove();
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
        packStatus={packStatus}
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
