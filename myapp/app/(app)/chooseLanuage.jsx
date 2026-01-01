import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ChooseLanguage() {
  const router = useRouter();
  const { wordPairs, firstLanguage, secondLanguage, to } = useLocalSearchParams();

  const parsedPairs = wordPairs
    ? JSON.parse(wordPairs).filter((item) => item.selected)
    : [];

  const handleSelect = (lang) => {
    router.replace({
      pathname: to,
      params: {
        wordPairs: JSON.stringify(parsedPairs),
        language: lang,
        firstLanguage: firstLanguage,
        secondLanguage: secondLanguage
      },
    });
  };

  if (!parsedPairs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No word pairs selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Language</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect("first")}
      >
        <Text style={styles.buttonText}>{firstLanguage}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect("second")}
      >
        <Text style={styles.buttonText}>{secondLanguage}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect("both")}
      >
        <Text style={styles.buttonText}>
          {firstLanguage} & {secondLanguage}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#1F2937",
  },
  button: {
    width: "80%",
    paddingVertical: 16,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    fontSize: 18,
    color: "gray",
  },
});
