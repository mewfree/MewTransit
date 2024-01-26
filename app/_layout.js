import { useState, useEffect, createContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

export const DbContext = createContext(null);

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
    Asset.fromModule(require("../assets/SQLite/exo_trains.db")).uri,
    FileSystem.documentDirectory + "SQLite/exo_trains.db"
  );

  return SQLite.openDatabase("exo_trains.db");
}

export const unstable_settings = {
  initialRouteName: "routes",
};

export default function Layout() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const setDbContext = async () => {
      const localDb = await openDatabase();
      setDb(localDb);
    };

    setDbContext();
  }, []);

  return (
    <DbContext.Provider value={db}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer>
          <Drawer.Screen
            name="routes"
            options={{
              drawerLabel: "Home",
              title: "Home",
            }}
          />
          <Drawer.Screen
            name="about"
            options={{
              drawerLabel: "About",
              title: "About",
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </DbContext.Provider>
  );
}
