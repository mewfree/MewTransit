import { useState, useEffect, useContext } from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";

import DbContext from "../DbContext";

const renderTime = ({ stopDetails, stopSequence, item, navigation }) => {
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
          color: item.stop_sequence < stopSequence ? "#ccc" : "#000",
          fontWeight: item.stop_id !== stopDetails.stop_id ? "500" : "700",
          fontSize: 20,
        }}
      >
        {item.departure_time.substring(0, 5)} - {item.stop_name}
        {item.wheelchair_boarding === 1 ? " ♿️" : ""}
        {item.wheelchair_boarding === 2 ? " ❌♿️" : ""}
      </Text>
    </View>
  );
};

export default function TripDetailsScreen({ route, navigation }) {
  const { routeDetails, stopDetails, tripId } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: tripId,
      headerStyle: {
        backgroundColor: "#" + routeDetails.route_color,
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
            `SELECT stops.stop_id, stops.stop_name, stops.wheelchair_boarding, stop_times.arrival_time, stop_times.departure_time, stop_times.stop_sequence
             FROM stop_times
             JOIN stops ON stop_times.stop_id = stops.stop_id
             WHERE stop_times.trip_id = ?
             ORDER BY stop_times.stop_sequence`,
            [tripId],
            (_, { rows }) => {
              setTimes(rows._array);
            },
          );
        });
      };

      getTimes();
    }
  }, [db]);

  const stopSequence = times.find(
    (time) => time.stop_id === stopDetails.stop_id,
  )?.stop_sequence;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.listContainer}
        data={times}
        renderItem={({ item }) =>
          renderTime({ stopDetails, stopSequence, item, navigation })
        }
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
