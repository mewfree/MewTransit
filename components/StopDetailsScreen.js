import { useState, useEffect, useContext } from "react";
import { FlatList, Pressable, View, Text, StyleSheet } from "react-native";
import DbContext from "../DbContext";

const renderTime = ({ item, navigation }) => {
  return (
    <View
      style={{
        padding: 6,
        marginBottom: 15,
        borderRadius: 4,
      }}
    >
      <Text
        style={{
          fontWeight: "500",
          fontSize: 20,
        }}
      >
        {item.departure_time.substring(0, 5)} - {item.trip_headsign}
      </Text>
    </View>
  );
};

export default function StopDetailsScreen({ route, navigation }) {
  const { routeDetails, stopDetails } = route.params;
  const routeId = routeDetails.route_id;
  const routeColor = routeDetails.route_color;
  const stopId = stopDetails.stop_id;
  const stopName = stopDetails.stop_name;

  useEffect(() => {
    navigation.setOptions({
      title: stopName,
      headerStyle: {
        backgroundColor: "#" + routeColor,
      },
    });
  }, [navigation]);

  const [times, setTimes] = useState([]);

  const db = useContext(DbContext);

  useEffect(() => {
    if (db !== null) {
      const getTimes = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT trips.trip_id, stop_times.departure_time, trips.trip_headsign, trips.direction_id
             FROM stops
             JOIN stop_times ON stops.stop_id = stop_times.stop_id
             JOIN trips ON stop_times.trip_id = trips.trip_id
             JOIN routes ON trips.route_id = routes.route_id
             JOIN calendar ON trips.service_id = calendar.service_id
             WHERE stops.stop_id = ?
             AND routes.route_id = ?
             AND time('now', 'localtime') <= stop_times.departure_time
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
            [stopId, routeId],
            (_, { rows }) => {
              setTimes(rows._array);
            }
          );
        });
      };

      getTimes();
    }
  }, [db]);

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.listContainer}
        data={times}
        renderItem={({ item }) => renderTime({ item, navigation })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    paddingTop: 12,
  },
});
