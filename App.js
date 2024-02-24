import { useColorScheme } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";

import DbContext from "./DbContext";
import AboutScreen from "./components/AboutScreen";
import HomeScreen from "./components/HomeScreen";

async function openDatabase() {
  if (
    !(await FileSystem.getInfoAsync(FileSystem.documentDirectory + "SQLite"))
      .exists
  ) {
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "SQLite",
    );
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(require("./assets/SQLite/exo_trains.db")).uri,
    FileSystem.documentDirectory + "SQLite/exo_trains.db",
  );

  return SQLite.openDatabase("exo_trains.db");
}

const Drawer = createDrawerNavigator();

export default function App() {
  const [db, setDb] = useState(null);
  const scheme = useColorScheme();

  const LightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#fff",
    },
  };

  useEffect(() => {
    const setDbContext = async () => {
      const localDb = await openDatabase();
      setDb(localDb);
    };

    setDbContext();
  }, []);

  return (
    <NavigationContainer theme={scheme === "dark" ? DarkTheme : LightTheme}>
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
