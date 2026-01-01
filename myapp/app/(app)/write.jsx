import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
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

export default function Write() {
  const { wordPairs, language, examId } = useLocalSearchParams();

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!cards.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No word pairs selected</Text>
      </View>
    );
  }

  const currentCard = cards[index];
  const currentDirection = directions[index];
  const showWord =
    currentDirection === "first" ? currentCard.second : currentCard.first;

  const handleChange = (text) => {
    const updated = [...userAnswers];
    updated[index] = text;
    setUserAnswers(updated);
  };

  const checkAnswer = (i) => {
    if (!userAnswers[i]) return false;
    return (
      userAnswers[i].trim().toLowerCase() ===
      (directions[i] === "first"
        ? cards[i].first
        : cards[i].second
      ).toLowerCase()
    );
  };

  const handleFinish = async () => {
    if (!examId) {
      setShowResults(true);
      return;
    }

    setIsSubmitting(true);
    const userId = FIREBASE_AUTH.currentUser?.uid;

    if (!userId) {
      Alert.alert("Error", "User session not found.");
      setIsSubmitting(false);
      return;
    }

    const score = userAnswers.reduce(
      (acc, _, i) => (checkAnswer(i) ? acc + 1 : acc),
      0
    );

    const submissionData = {
      score: score,
      total: cards.length,
      finishedAt: new Date().toISOString(),
      details: cards.map((card, i) => ({
        word: directions[i] === "first" ? card.second : card.first,
        correctAnswer: directions[i] === "first" ? card.first : card.second,
        userAnswer: userAnswers[i] || "",
        isCorrect: checkAnswer(i),
      })),
    };

    try {
      await writeData(`/exams_end/${examId}/${userId}`, submissionData);
      setShowResults(true);
    } catch (error) {
      Alert.alert("Submission Failed", "Could not send results to teacher.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (index < cards.length - 1) setIndex(index + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleRetryAll = () => {
    initializeCards(cleanPairs);
  };

  if (showResults) {
    const finalScore = userAnswers.reduce(
      (acc, _, i) => (checkAnswer(i) ? acc + 1 : acc),
      0
    );
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.counter}>Exam Finished</Text>
        <Text style={[styles.word, { color: "#10B981" }]}>
          Score: {finalScore} / {cards.length}
        </Text>

        {cards.map((pair, i) => {
          const user = userAnswers[i] || "(No answer)";
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
              <Text style={styles.answer}>Your answer: {user}</Text>
              {!checkAnswer(i) && (
                <Text style={styles.answer}>Correct: {correct}</Text>
              )}
            </View>
          );
        })}

        <View style={{ marginBottom: 50 }}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetryAll}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.counter}>
            {index + 1} / {cards.length}
          </Text>

          <View style={styles.card}>
            <Text style={styles.word}>{showWord}</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your answer"
              value={userAnswers[index]}
              onChangeText={handleChange}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.navButton, { opacity: index === 0 ? 0.5 : 1 }]}
              onPress={handlePrev}
              disabled={index === 0}
            >
              <Text style={styles.navText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: isSubmitting ? "#9CA3AF" : "#3B82F6" },
              ]}
              onPress={handleNext}
              disabled={isSubmitting}
            >
              <Text style={styles.navText}>
                {isSubmitting
                  ? "Sending..."
                  : index < cards.length - 1
                  ? "Next"
                  : "Finish"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 10,
    padding: 16,
    fontSize: 20,
    backgroundColor: "#f0f9ff",
    textAlign: "center",
  },
  counter: {
    fontSize: 20,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    width: "90%",
    justifyContent: "space-between",
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
