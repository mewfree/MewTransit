import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoutesListScreen from "./RoutesListScreen";
import RouteDetailsScreen from "./RouteDetailsScreen";
import StopDetailsScreen from "./StopDetailsScreen";

const Stack = createNativeStackNavigator();

export default function HomeScreen({ navigation }) {
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
        options={{
          headerBackTitle: "Lines",
        }}
      />
      <Stack.Screen name="StopDetails" component={StopDetailsScreen} />
    </Stack.Navigator>
  );
}
