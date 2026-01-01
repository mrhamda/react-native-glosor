import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import {
  FIREBASE_AUTH,
  readData,
  writeData,
  removeData,
} from "../../../FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function QuizDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (currentUser) => {
        setUser(currentUser);

        if (id) {
          const quizData = await readData(`/quizes/${id}`);
          if (quizData) {
            const mappedPairs = Array.isArray(quizData.wordPairs)
              ? quizData.wordPairs.map((pair) => ({
                  first: pair.first || "",
                  second: pair.second || "",
                  selected: true,
                }))
              : [];
            setQuiz({ quizID: id, ...quizData, wordPairs: mappedPairs });
          }

          // Check if quiz is in user's favorites
          if (currentUser) {
            const userData = await readData(`/users/${currentUser.uid}`);
            const favorites = userData?.favorites || [];
            setIsFavorite(favorites.includes(id));
          }
        }

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [id]);

  const togglePair = (index) => {
    setQuiz((prev) => {
      const newPairs = [...prev.wordPairs];
      newPairs[index].selected = !newPairs[index].selected;
      return { ...prev, wordPairs: newPairs };
    });
  };

  const handleEdit = () => {
    router.replace({
      pathname: "(app)/createQuiz",
      params: { quizID: quiz.quizID },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Quiz",
      "Are you sure you want to delete this quiz?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeData(`/quizes/${id}`);
              router.replace("/(app)/");
            } catch (error) {
              Alert.alert(
                "Error",
                "Could not delete quiz. Check your permissions."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleFavorite = async () => {
    if (!user) return;
    const userRef = `/users/${user.uid}`;
    const userData = (await readData(userRef)) || {};
    const favorites = userData.favorites || [];

    let newFavorites;
    if (isFavorite) {
      // Remove from favorites
      newFavorites = favorites.filter((quizID) => quizID !== id);
    } else {
      // Add to favorites
      newFavorites = [...favorites, id];
    }

    setIsFavorite(!isFavorite);
    await writeData(userRef + "/favorites", newFavorites);
  };

  const isOwner = user?.uid === quiz?.createdBy;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Quiz not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{quiz.title || "Untitled Quiz"}</Text>

        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          {isOwner && (
            <>
              <TouchableOpacity onPress={handleEdit}>
                <MaterialIcons name="edit" size={28} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <MaterialIcons name="delete" size={28} color="#f63b4bff" />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={handleFavorite}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={28}
              color={isFavorite ? "red" : "gray"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subtitle}>ID: {quiz.quizID}</Text>
      <Text style={styles.subtitle}>
        {quiz.firstLanguage} → {quiz.secondLanguage}
      </Text>

      <View style={styles.buttonGrid}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/flashcards",
              params: { id: id, wordPairs: JSON.stringify(quiz.wordPairs) },
            });
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Flashcards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/chooseLanuage",
              params: {
                id: id,
                wordPairs: JSON.stringify(quiz.wordPairs),
                firstLanguage: quiz.firstLanguage,
                secondLanguage: quiz.secondLanguage,
                to: "/alternatives",
              },
            });
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Alternatives</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/chooseLanuage",
              params: {
                id: id,
                wordPairs: JSON.stringify(quiz.wordPairs),
                firstLanguage: quiz.firstLanguage,
                secondLanguage: quiz.secondLanguage,
                to: "/write",
              },
            });
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Write</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/chooseLanuage",
              params: {
                id: id,
                wordPairs: JSON.stringify(quiz.wordPairs),
                firstLanguage: quiz.firstLanguage,
                secondLanguage: quiz.secondLanguage,
                to: "/bird",
              },
            });
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Bird</Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Listen</Text>
        </TouchableOpacity> */}
      </View>

      <FlatList
        data={quiz.wordPairs}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.wordPair}>
            <Text style={styles.word}>{item.first}</Text>
            <Text style={styles.translation}>{item.second}</Text>
            <Switch
              value={item.selected}
              onValueChange={() => togglePair(index)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    margin: 16,
  },
  button: {
    width: "48%",
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 18, color: "red" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#1F2937" },
  subtitle: { fontSize: 16, color: "#6B7280", marginBottom: 8 },
  wordPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  word: { fontSize: 16, fontWeight: "500", marginRight: 16 },
  translation: { fontSize: 16, color: "#374151", marginRight: 16 },
});
