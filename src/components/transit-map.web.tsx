import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import type { Coords, NearbyStop } from "@/lib/types";

// Web keeps network nearby (Worker). The downloaded city pack is native-only.
import {
  buildMapHtml,
  parseMapMessage,
  stopPins,
  type HostToMap,
} from "./map-html";

export function TransitMap({
  center,
  user,
  stops,
  onSelect,
  onMoveEnd,
}: {
  center: Coords;
  user: Coords | null;
  stops: NearbyStop[];
  showsUser: boolean;
  onSelect: (stop: NearbyStop) => void;
  onMoveEnd?: (coords: Coords) => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const [origin] = useState(center);
  const pins = useMemo(() => stopPins(stops), [stops]);
  const html = useMemo(
    () => buildMapHtml({ lat: origin.lat, lon: origin.lon, dark }),
    [dark, origin.lat, origin.lon],
  );

  useEffect(() => {
    readyRef.current = false;
  }, [dark]);

  const send = useCallback((msg: HostToMap) => {
    frameRef.current?.contentWindow?.postMessage(msg, "*");
  }, []);

  const pushState = useCallback(() => {
    send({ type: "stops", stops: pins });
    send(
      user
        ? { type: "user", show: true, lat: user.lat, lon: user.lon }
        : { type: "user", show: false },
    );
    send({ type: "center", lat: center.lat, lon: center.lon });
  }, [center.lat, center.lon, pins, send, user]);

  useEffect(() => {
    if (readyRef.current) pushState();
  }, [pushState]);

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (frameRef.current && event.source !== frameRef.current.contentWindow) {
        return;
      }
      const msg = parseMapMessage(event.data);
      if (!msg) return;
      if (msg.type === "ready") {
        readyRef.current = true;
        pushState();
        return;
      }
      if (msg.type === "select") {
        const stop = stops.find((s) => s.id === msg.id);
        if (stop) onSelect(stop);
        return;
      }
      if (msg.type === "move") {
        onMoveEnd?.({ lat: msg.lat, lon: msg.lon });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onMoveEnd, onSelect, pushState, stops]);

  return (
    <View style={[styles.map, { backgroundColor: theme.background }]}>
      {createElement("iframe", {
        ref: frameRef,
        srcDoc: html,
        title: "Transit map",
        onLoad: () => {
          readyRef.current = true;
          pushState();
        },
        style: {
          border: "none",
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor: theme.background,
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
