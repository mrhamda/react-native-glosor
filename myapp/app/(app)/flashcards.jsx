import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Flashcards() {
  const { wordPairs } = useLocalSearchParams();
  const parsedPairs = wordPairs ? JSON.parse(wordPairs).filter((item) => item.selected == true) : [];

  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const currentCard = parsedPairs[index];

  const nextCard = () => {
    setShowBack(false);
    setIndex((prev) => (prev + 1) % parsedPairs.length);
  };

  if (!parsedPairs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No word pairs available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: showBack ? "#e0f2fe" : "#fff" },
        ]}
        onPress={() => setShowBack(!showBack)}
      >
        <Text style={styles.word}>
          {showBack ? currentCard.second : currentCard.first}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextButton} onPress={nextCard}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

      <Text style={styles.counter}>
        {index + 1} / {parsedPairs.length}
      </Text>
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
  card: {
    width: "80%",
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    marginBottom: 24,
  },
  word: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  nextButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  counter: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 14,
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
