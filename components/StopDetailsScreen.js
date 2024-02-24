import { useState, useEffect, useContext } from "react";
import { FlatList, Pressable, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

import DbContext from "../DbContext";

const renderTime = ({
  routeDetails,
  stopDetails,
  item,
  navigation,
  colors,
}) => {
  return (
    <View
      style={{
        padding: 6,
        marginBottom: 15,
        borderRadius: 4,
      }}
    >
      <Pressable
        onPress={() => {
          navigation.navigate("TripDetails", {
            routeDetails,
            stopDetails,
            tripId: item.trip_id,
          });
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontWeight: "500",
            fontSize: 20,
          }}
        >
          {item.departure_time.substring(0, 5)} - {item.trip_headsign}
          {item.bikes_allowed === 1 ? " 🚲" : ""}
          {item.bikes_allowed === 2 ? " 🚳" : ""}
          {item.wheelchair_accessible === 1 ? " ♿️" : ""}
          {item.wheelchair_accessible === 2 ? " ❌♿️" : ""}
        </Text>
      </Pressable>
    </View>
  );
};

export default function StopDetailsScreen({ route, navigation }) {
  const { routeDetails, stopDetails } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: stopDetails.stop_name,
      headerStyle: {
        backgroundColor: "#" + routeDetails.route_color,
      },
      headerTitleStyle: {
        color: "#000",
      },
    });
  }, [navigation]);

  const [times, setTimes] = useState([]);

  const db = useContext(DbContext);
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 4,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    listContainer: {
      paddingTop: 12,
    },
  });

  useEffect(() => {
    if (db !== null) {
      const getTimes = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT trips.trip_id, stop_times.departure_time, trips.trip_headsign, trips.direction_id, trips.bikes_allowed, trips.wheelchair_accessible
             FROM stops
             JOIN stop_times ON stops.stop_id = stop_times.stop_id
             JOIN trips ON stop_times.trip_id = trips.trip_id
             JOIN routes ON trips.route_id = routes.route_id
             JOIN calendar ON trips.service_id = calendar.service_id
             LEFT JOIN (SELECT trip_id, MAX(stop_sequence) AS max_sequence
                 FROM stop_times
                 GROUP BY trip_id) AS last_stops ON trips.trip_id = last_stops.trip_id
             WHERE stops.stop_id = ?
             AND routes.route_id = ?
             AND time('now', 'localtime') <= stop_times.departure_time
             AND stop_times.stop_sequence < last_stops.max_sequence
             AND (
                 (strftime('%w', 'now') = '0' AND calendar.sunday = 1) OR
                 (strftime('%w', 'now') = '1' AND calendar.monday = 1) OR
                 (strftime('%w', 'now') = '2' AND calendar.tuesday = 1) OR
                 (strftime('%w', 'now') = '3' AND calendar.wednesday = 1) OR
                 (strftime('%w', 'now') = '4' AND calendar.thursday = 1) OR
                 (strftime('%w', 'now') = '5' AND calendar.friday = 1) OR
                 (strftime('%w', 'now') = '6' AND calendar.saturday = 1)
             )
             AND date('now') BETWEEN
                 substr(calendar.start_date, 1, 4) || '-' || substr(calendar.start_date, 5, 2) || '-' || substr(calendar.start_date, 7, 2)
                 AND
                 substr(calendar.end_date, 1, 4) || '-' || substr(calendar.end_date, 5, 2) || '-' || substr(calendar.end_date, 7, 2)
             ORDER BY stop_times.departure_time
             LIMIT 25`,
            [stopDetails.stop_id, routeDetails.route_id],
            (_, { rows }) => {
              setTimes(rows._array);
            },
          );
        });
      };

      getTimes();
    }
  }, [db]);

  return (
    <View style={styles.container}>
      {times.length === 0 ? (
        <Text style={{ color: colors.text, fontSize: 18 }}>
          No more departures 😢
        </Text>
      ) : (
        <FlatList
          style={styles.listContainer}
          data={times}
          renderItem={({ item }) =>
            renderTime({ routeDetails, stopDetails, item, navigation, colors })
          }
        />
      )}
    </View>
  );
}
