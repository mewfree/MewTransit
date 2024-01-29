import { View, StyleSheet, Text } from "react-native";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>👋</Text>
      <Text style={styles.titleText}>❤️</Text>
      <Text style={styles.titleText}>🚆️</Text>
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
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 24,
  },
});
