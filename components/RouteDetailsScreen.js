import { useState, useEffect, useContext } from "react";
import { FlatList, Pressable, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

import DbContext from "../DbContext";

const renderStop = ({ routeDetails, item, navigation, colors }) => {
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
          navigation.navigate("StopDetails", {
            routeDetails,
            stopDetails: item,
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
          {item.stop_name}
          {item.wheelchair_boarding === 1 ? " ♿️" : ""}
          {item.wheelchair_boarding === 2 ? " ❌♿️" : ""}
        </Text>
      </Pressable>
    </View>
  );
};

export default function RouteDetailsScreen({ route, navigation }) {
  const { routeDetails } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: routeDetails.route_long_name,
      headerStyle: {
        backgroundColor: "#" + routeDetails.route_color,
      },
      headerTitleStyle: {
        color: "#000",
      },
    });
  }, [navigation]);

  const [stops, setStops] = useState([]);

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
      const getStops = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT DISTINCT stops.stop_id, stops.stop_name, stops.wheelchair_boarding
             FROM routes
             JOIN trips ON routes.route_id = trips.route_id
             JOIN stop_times ON trips.trip_id = stop_times.trip_id
             JOIN stops ON stop_times.stop_id = stops.stop_id
             WHERE routes.route_id = ?
             ORDER BY stop_times.stop_sequence`,
            [routeDetails.route_id],
            (_, { rows }) => {
              setStops(rows._array);
            },
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
        renderItem={({ item }) =>
          renderStop({ routeDetails, item, navigation, colors })
        }
      />
    </View>
  );
}
