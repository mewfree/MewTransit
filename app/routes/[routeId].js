import { useState, useEffect, useContext } from "react";
import { FlatList, Pressable, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useNavigation, Link } from "expo-router";
import { DbContext } from "../_layout";

const renderStop = ({ routeId, item }) => {
  return (
    <View
      style={{
        padding: 6,
        marginBottom: 15,
        borderRadius: 4,
      }}
    >
      <Link href={`/routes/${routeId}/routes`} asChild>
        <Pressable>
          <Text
            style={{
              fontWeight: "500",
              fontSize: 20,
            }}
          >
            {item.stop_name}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default function Page() {
  const { routeId } = useLocalSearchParams();

  const [routeDetails, setRouteDetails] = useState({
    route_long_name: "Loading",
    route_color: "fff",
  });

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: routeDetails.route_long_name,
      headerStyle: {
        backgroundColor: "#" + routeDetails.route_color,
      },
    });
  }, [navigation, routeDetails]);

  const [stops, setStops] = useState([]);

  const db = useContext(DbContext);

  useEffect(() => {
    if (db !== null) {
      const getRouteDetails = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT route_long_name, route_color
             FROM routes
             WHERE route_id = ?`,
            [routeId],
            (_, { rows }) => {
              setRouteDetails(rows._array[0]);
            }
          );
        });
      };

      getRouteDetails();

      const getStops = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT DISTINCT stops.stop_id, stops.stop_name
             FROM routes
             JOIN trips ON routes.route_id = trips.route_id
             JOIN stop_times ON trips.trip_id = stop_times.trip_id
             JOIN stops ON stop_times.stop_id = stops.stop_id
             WHERE routes.route_id = ?
             ORDER BY stop_times.stop_sequence`,
            [routeId],
            (_, { rows }) => {
              setStops(rows._array);
            }
          );
        });
      };

      getStops();
    }
  }, [db]);

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.listContainer}
        data={stops}
        renderItem={({ item }) => renderStop({ routeId, item })}
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
