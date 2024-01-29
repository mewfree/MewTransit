import { useState, useEffect, createContext } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";

import DbContext from "./DbContext";
import HomeScreen from "./components/HomeScreen";
import AboutScreen from "./components/AboutScreen";

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

const Drawer = createDrawerNavigator();

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
