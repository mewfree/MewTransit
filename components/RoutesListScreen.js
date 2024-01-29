import { useState, useEffect, useContext } from "react";
import { FlatList, Pressable, View, Text, StyleSheet } from "react-native";

import DbContext from "../DbContext";

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

export default function RoutesListScreen({ navigation }) {
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
