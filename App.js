import { StatusBar } from "expo-status-bar";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import routes from "./routes.json";

const renderItem = ({ item }) => {
  if (item.route_type == 1) {
    return (
      <View
        style={{
          padding: 6,
          marginBottom: 15,
          borderRadius: 4,
          backgroundColor: "#" + item.route_color,
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 20,
            color: "#" + item.route_text_color,
          }}
        >
          🚇 {item.route_long_name}
        </Text>
      </View>
    );
  }

  if (item.route_type == 3) {
    return (
      <View
        style={{
          padding: 5,
          marginBottom: 5,
          borderRadius: 4,
          backgroundColor: "#" + item.route_color,
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 20,
            color: "#" + item.route_text_color,
          }}
        >
          🚌 {item.route_short_name} - {item.route_long_name}
        </Text>
      </View>
    );
  }
};

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Welcome to MewTransit!</Text>
      <FlatList
        style={styles.listContainer}
        data={routes}
        renderItem={({ item }) => renderItem({ item })}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
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
