import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Coords, NearbyStop } from "@/lib/types";

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
  const webRef = useRef<WebView>(null);
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
    const js = `window.__mew && window.__mew.apply(${JSON.stringify(msg)}); true;`;
    webRef.current?.injectJavaScript(js);
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

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const msg = parseMapMessage(event.nativeEvent.data);
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
    },
    [onMoveEnd, onSelect, pushState, stops],
  );

  return (
    <WebView
      ref={webRef}
      key={dark ? "dark" : "light"}
      source={{ html, baseUrl: "https://unpkg.com/" }}
      style={[styles.map, { backgroundColor: theme.background }]}
      originWhitelist={["*"]}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      mixedContentMode="compatibility"
      androidLayerType="hardware"
      onLoadEnd={() => {
        readyRef.current = true;
        pushState();
      }}
      onMessage={onMessage}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
