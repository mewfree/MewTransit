import { useState, useEffect, createContext, useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { FlatList, StyleSheet, Text, Pressable, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";

async function openDatabase() {
  if (
    !(await FileSystem.getInfoAsync(FileSystem.documentDirectory + "SQLite"))
      .exists
  ) {
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "SQLite"
    );
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(require("./assets/SQLite/exo_trains.db")).uri,
    FileSystem.documentDirectory + "SQLite/exo_trains.db"
  );

  return SQLite.openDatabase("exo_trains.db");
}

const renderRoute = ({ item, navigation }) => {
  return (
    <View
      style={{
        padding: 12,
        marginBottom: 15,
        borderRadius: 4,
        backgroundColor: "#" + item.route_color,
      }}
    >
      <Pressable
        onPress={() => {
          navigation.navigate("RouteDetails", {
            routeDetails: item,
          });
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 20,
            color: "#" + item.route_text_color,
          }}
        >
          {nameRoute(item)}
        </Text>
      </Pressable>
    </View>
  );
};

const renderStop = ({ routeDetails, item, navigation }) => {
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
            routeDetails: routeDetails,
            stopDetails: item,
          });
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 20,
          }}
        >
          {item.stop_name}
        </Text>
      </Pressable>
    </View>
  );
};

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

const nameRoute = (route) => {
  switch (route.route_type) {
    case 1:
      return "🚇 " + route.route_long_name;
    case 2:
      return "🚆 " + route.route_long_name;
    case 3:
      return "🚍 " + route.route_short_name + " - " + route.route_long_name;
    default:
      return "🤷 " + route.route_short_name + " - " + route.route_long_name;
  }
};

function RoutesListScreen({ navigation }) {
  const [routes, setRoutes] = useState([]);

  const db = useContext(DbContext);

  useEffect(() => {
    if (db !== null) {
      const getRoutes = async () => {
        db.transaction((tx) => {
          tx.executeSql("select * from routes", [], (_, { rows }) => {
            setRoutes(rows._array);
          });
        });
      };

      getRoutes();
    }
  }, [db]);

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>EXO - Train Lines</Text>
      <FlatList
        style={styles.listContainer}
        data={routes}
        renderItem={({ item }) => renderRoute({ item, navigation })}
      />
    </View>
  );
}

function RouteDetailsScreen({ route, navigation }) {
  const { routeDetails } = route.params;
  const routeId = routeDetails.route_id;
  const routeName = routeDetails.route_long_name;
  const routeColor = routeDetails.route_color;

  useEffect(() => {
    navigation.setOptions({
      title: routeName,
      headerStyle: {
        backgroundColor: "#" + routeColor,
      },
    });
  }, [navigation]);

  const [stops, setStops] = useState([]);

  const db = useContext(DbContext);

  useEffect(() => {
    if (db !== null) {
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
        renderItem={({ item }) =>
          renderStop({ routeDetails, item, navigation })
        }
      />
    </View>
  );
}

function StopDetailsScreen({ route, navigation }) {
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
             LIMIT 15`,
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

function HomeScreen({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="RoutesList">
      <Stack.Screen
        name="RoutesList"
        component={RoutesListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
      <Stack.Screen name="StopDetails" component={StopDetailsScreen} />
    </Stack.Navigator>
  );
}

function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>👋</Text>
      <Text style={styles.titleText}>❤️</Text>
      <Text style={styles.titleText}>🚆️</Text>
    </View>
  );
}

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const DbContext = createContext(null);

export default function App() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const setDbContext = async () => {
      const localDb = await openDatabase();
      setDb(localDb);
    };

    setDbContext();
  }, []);

  return (
    <NavigationContainer>
      <DbContext.Provider value={db}>
        <Drawer.Navigator initialRouteName="Home">
          <Drawer.Screen
            name="Home"
            component={HomeScreen}
            options={{ drawerLabel: "Home" }}
          />
          <Drawer.Screen
            name="About"
            component={AboutScreen}
            options={{ drawerLabel: "About" }}
          />
        </Drawer.Navigator>
        <StatusBar style="auto" />
      </DbContext.Provider>
    </NavigationContainer>
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
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 24,
  },
});
