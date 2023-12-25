import { StatusBar } from "expo-status-bar";
import { FlatList, StyleSheet, Text, Pressable, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import routes from "./routes.json";

const renderItem = ({ item, navigation }) => {
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
            itemId: item.route_id,
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

const nameRoute = (item) =>
  item.route_type == 1
    ? "🚇 " + item.route_long_name
    : "🚌 " + item.route_short_name + " - " + item.route_long_name;

function RoutesListScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Welcome to MewTransit</Text>
      <FlatList
        style={styles.listContainer}
        data={routes}
        renderItem={({ item }) => renderItem({ item, navigation })}
      />
      <StatusBar style="auto" />
    </View>
  );
}

function RouteDetailsScreen({ route, navigation }) {
  const { itemId } = route.params;
  const item = routes.find((item) => item.route_id == itemId);

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{nameRoute(item)}</Text>
      <StatusBar style="auto" />
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
      <Stack.Screen
        name="RouteDetails"
        component={RouteDetailsScreen}
        options={({ route }) => ({
          title: nameRoute(
            routes.find((item) => item.route_id == route.params.itemId)
          ),
        })}
      />
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

export default function App() {
  return (
    <NavigationContainer>
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
