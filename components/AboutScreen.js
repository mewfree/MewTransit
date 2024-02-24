import { View, StyleSheet, Text } from "react-native";
import { useTheme } from "@react-navigation/native";

export default function AboutScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 4,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    titleText: {
      fontSize: 24,
      fontWeight: "bold",
      padding: 24,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>👋</Text>
      <Text style={styles.titleText}>❤️</Text>
      <Text style={styles.titleText}>🚆️</Text>
    </View>
  );
}
