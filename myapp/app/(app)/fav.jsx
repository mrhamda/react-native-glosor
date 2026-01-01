import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH, readData } from "../../FirebaseConfig";
import { useRouter } from "expo-router";

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [favoriteQuizzes, setFavoriteQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (currentUser) => {
        setUser(currentUser);
        setLoading(true);

        if (currentUser) {
          const userData = await readData(`/users/${currentUser.uid}`);
          const favorites = userData?.favorites || [];

          const quizzesData = await Promise.all(
            favorites.map(async (quizID) => {
              const quiz = await readData(`/quizes/${quizID}`);
              if (!quiz) return null;

              if (
                quiz.visibility === "public" ||
                quiz.createdBy === currentUser.uid
              ) {
                return {
                  quizID,
                  ...quiz,
                  wordPairs: quiz.wordPairs?.map((pair) => ({ ...pair })) || [],
                };
              }
              return null;
            })
          );

          setFavoriteQuizzes(quizzesData.filter(Boolean)); 
        } else {
          setFavoriteQuizzes([]);
        }

        setLoading(false);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    );

    return unsubscribe;
  }, []);

  const renderQuizItem = ({ item }) => (
    <Animated.View style={[styles.quizCard, { opacity: fadeAnim }]}>
      <TouchableOpacity
        onPress={() => router.push(`/quiz/${item.quizID}`)}
        style={styles.quizTouchable}
      >
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>{item.title || "Untitled Quiz"}</Text>
          <Ionicons
            name={item.visibility === "private" ? "lock-closed" : "eye"}
            size={20}
            color="gray"
          />
        </View>
        <Text style={styles.quizSubtitle}>
          {item.wordPairs.length} word pairs
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (favoriteQuizzes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>No favorites yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteQuizzes}
        keyExtractor={(item) => item.quizID}
        renderItem={renderQuizItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  listContainer: { padding: 16, paddingBottom: 100 },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizTouchable: { flexDirection: "column" },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quizTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  quizSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 18, color: "#6B7280" },
});
