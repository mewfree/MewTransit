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
        padding: 6,
        marginBottom: 15,
        borderRadius: 4,
        backgroundColor: "#" + item.route_color,
      }}
    >
      <Pressable
        onPress={() => {
          navigation.navigate("RouteDetails", {
            routeId: item.route_id,
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

const renderTrip = ({ item }) => {
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
        {item.trip_headsign}
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
      <Text style={styles.titleText}>Welcome to MewTransit</Text>
      <FlatList
        style={styles.listContainer}
        data={routes}
        renderItem={({ item }) => renderRoute({ item, navigation })}
      />
    </View>
  );
}

function RouteDetailsScreen({ route, navigation }) {
  const { routeId } = route.params;
  const [routeName, setRouteName] = useState("Loading...");
  const [trips, setTrips] = useState([]);

  const db = useContext(DbContext);

  useEffect(() => {
    if (db !== null) {
      const getRouteName = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            "select * from routes where route_id=?",
            [routeId],
            (_, { rows }) => {
              setRouteName(rows._array[0].route_long_name);
            }
          );
        });
      };

      getRouteName();
    }

    navigation.setOptions({
      title: routeName,
    });
  }, [db, routeName]);

  useEffect(() => {
    if (db !== null) {
      const getTrips = async () => {
        db.transaction((tx) => {
          tx.executeSql(
            "select * from trips where route_id=?",
            [routeId],
            (_, { rows }) => {
              setTrips(rows._array);
            }
          );
        });
      };

      getTrips();
    }
  }, [db]);

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Route Details</Text>
      <FlatList
        style={styles.listContainer}
        data={trips.filter((trip) => trip.route_id == routeId)}
        renderItem={({ item }) => renderTrip({ item })}
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
    </Stack.Navigator>
  );
}

function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>👋</Text>
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
