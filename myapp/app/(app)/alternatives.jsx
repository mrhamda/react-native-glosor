import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { FIREBASE_AUTH, writeData } from "../../FirebaseConfig"; 

const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function Alternatives() {
  const { wordPairs, language, examId } = useLocalSearchParams();
  const router = useRouter();
  const user = FIREBASE_AUTH.currentUser;

  const cleanPairs = wordPairs
    ? JSON.parse(wordPairs)
        .filter((item) => item.selected)
        .map((item) => ({
          first: item.first.trim(),
          second: item.second.trim(),
        }))
    : [];

  const [cards, setCards] = useState([]);
  const [directions, setDirections] = useState([]);
  const [index, setIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [options, setOptions] = useState([]);

  const initializeCards = (pairs) => {
    const shuffled = shuffleArray(pairs);
    const dirs = shuffled.map(() =>
      language === "both"
        ? Math.random() < 0.5
          ? "first"
          : "second"
        : language
    );
    setCards(shuffled);
    setDirections(dirs);
    setUserAnswers(Array(shuffled.length).fill(""));
    setIndex(0);
    setShowResults(false);
  };

  useEffect(() => {
    if (cleanPairs.length > 0) initializeCards(cleanPairs);
  }, []);

  useEffect(() => {
    if (!cards.length) return;
    generateOptions();
  }, [cards, index]);

  const currentCard = cards[index];
  const currentDirection = directions[index];

  if (!currentCard) return null;

  const showWord =
    currentDirection === "first" ? currentCard.second : currentCard.first;
  const correctAnswer =
    currentDirection === "first" ? currentCard.first : currentCard.second;

  const generateOptions = () => {
    const otherOptions = cards
      .map((c, i) =>
        i !== index ? (currentDirection === "first" ? c.first : c.second) : null
      )
      .filter(Boolean);

    const shuffledOtherOptions = shuffleArray(otherOptions).slice(0, 3);
    const allOptions = shuffleArray([correctAnswer, ...shuffledOtherOptions]);
    setOptions(allOptions);
  };

  const handleSelect = (option) => {
    const updated = [...userAnswers];
    updated[index] = option;
    setUserAnswers(updated);
  };

  const checkAnswer = (i) =>
    userAnswers[i] ===
    (directions[i] === "first" ? cards[i].first : cards[i].second);

  const handleFinish = async () => {
    setShowResults(true);

    if (examId && user) {
      const score = cards.reduce(
        (acc, _, i) => (checkAnswer(i) ? acc + 1 : acc),
        0
      );

      const submissionData = {
        score: score,
        total: cards.length,
        timestamp: Date.now(),
        details: cards.map((pair, i) => ({
          word: directions[i] === "first" ? pair.second : pair.first,
          correctAnswer: directions[i] === "first" ? pair.first : pair.second,
          userAnswer: userAnswers[i],
          isCorrect: checkAnswer(i),
        })),
      };

      try {
        await writeData(`/exams_end/${examId}/${user.uid}`, submissionData);
      } catch (error) {
        Alert.alert("Error", "Failed to submit results to the teacher.");
      }
    }
  };

  const handleRetryAll = () => initializeCards(cleanPairs);

  const handleRetryFailed = () => {
    const failedIndices = cards.map((_, i) => i).filter((i) => !checkAnswer(i));
    if (failedIndices.length === 0) return initializeCards(cleanPairs);

    const failedPairs = failedIndices.map((i) => cards[i]);
    const failedDirections = failedIndices.map((i) => directions[i]);

    setCards(failedPairs);
    setDirections(failedDirections);
    setUserAnswers(Array(failedPairs.length).fill(""));
    setIndex(0);
    setShowResults(false);
  };

  if (!cards.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No word pairs selected</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.counter}>Results</Text>
        <Text style={styles.scoreText}>
          Score: {cards.filter((_, i) => checkAnswer(i)).length} /{" "}
          {cards.length}
        </Text>

        {cards.map((pair, i) => {
          const userText = userAnswers[i] || "(No answer)";
          const correct = directions[i] === "first" ? pair.first : pair.second;
          return (
            <View
              key={i}
              style={[
                styles.resultCard,
                { backgroundColor: checkAnswer(i) ? "#d1fae5" : "#fee2e2" },
              ]}
            >
              <Text style={styles.word}>
                {directions[i] === "first" ? pair.second : pair.first}
              </Text>
              <Text style={styles.answer}>Your answer: {userText}</Text>
              {!checkAnswer(i) && (
                <Text style={styles.answer}>Correct: {correct}</Text>
              )}
            </View>
          );
        })}

        {/* Hide retry buttons if it's a live exam */}
        {!examId ? (
          <View style={{ marginBottom: 50 }}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryAll}
            >
              <Text style={styles.retryText}>Try Again (All Words)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryFailed}
            >
              <Text style={styles.retryText}>Try Again (Failed Words)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: "#10B981", marginBottom: 50 },
            ]}
            onPress={() => router.replace("/exam")}
          >
            <Text style={styles.retryText}>Return to Lobby</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.counter}>
        {index + 1} / {cards.length}
      </Text>

      <View style={styles.card}>
        <Text style={styles.word}>{showWord}</Text>
        {options.map((opt, i) => {
          const isSelected = userAnswers[index] === opt;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.optionButton,
                { backgroundColor: isSelected ? "#1E40AF" : "#3B82F6" },
              ]}
              onPress={() => handleSelect(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.navButton, index === 0 && { opacity: 0.5 }]}
          disabled={index === 0}
          onPress={() => setIndex(index - 1)}
        >
          <Text style={styles.navText}>Previous</Text>
        </TouchableOpacity>

        {index < cards.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setIndex(index + 1)}
          >
            <Text style={styles.navText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: "#10B981" }]}
            onPress={handleFinish}
          >
            <Text style={styles.navText}>Finish</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "90%",
    minHeight: 220,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    marginBottom: 32,
    padding: 24,
    backgroundColor: "#fff",
  },
  word: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  counter: {
    fontSize: 20,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "600",
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 20,
  },
  optionButton: {
    width: "100%",
    paddingVertical: 16,
    marginVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  optionText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  buttonRow: {
    flexDirection: "row",
    width: "90%",
    justifyContent: "space-between",
    marginTop: 16,
  },
  navButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  navText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 20, color: "gray" },
  resultCard: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
  },
  answer: { fontSize: 18, marginTop: 4 },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    alignSelf: "center",
  },
  retryText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
