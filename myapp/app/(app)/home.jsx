import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  Animated,
  Modal,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH, readData } from "../../FirebaseConfig";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function Login() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myQuizes, setMyQuizes] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(
        FIREBASE_AUTH,
        async (currentUser) => {
          setUser(currentUser);
          setLoading(true);

          if (currentUser) {
            const allQuizzes = (await readData(`/quizes/`)) || {};
            const userQuizzes = Object.entries(allQuizzes)
              .filter(([key, quiz]) => quiz.createdBy === currentUser.uid)
              .map(([key, quiz]) => ({
                quizID: key,
                ...quiz,
                wordPairs: quiz.wordPairs?.map((pair) => ({ ...pair })) || [],
              }));
            setMyQuizes(userQuizzes);
          } else {
            setMyQuizes([]);
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
    }, [])
  );

  useEffect(() => {
    if (!searchQuery || !user) {
      setFilteredQuizzes([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    const fetchAllQuizzes = async () => {
      const allQuizzesData = (await readData(`/quizes/`)) || {};
      const allQuizzes = Object.entries(allQuizzesData).map(([key, quiz]) => ({
        quizID: key,
        ...quiz,
        wordPairs: quiz.wordPairs?.map((pair) => ({ ...pair })) || [],
      }));

      const results = allQuizzes.filter((quiz) => {
        const matchesQuery =
          quiz.quizID.toLowerCase().includes(query) ||
          (quiz.title && quiz.title.toLowerCase().includes(query));

        const canView =
          quiz.visibility === "public" || quiz.createdBy === user.uid;

        return matchesQuery && canView;
      });

      setFilteredQuizzes(results);
    };

    fetchAllQuizzes();
  }, [searchQuery, user]);

  const handlePlusPress = () => router.push("/createQuiz");

  const renderQuizItem = ({ item }) => (
    <Animated.View style={[styles.quizCard, { opacity: fadeAnim }]}>
      <TouchableOpacity
        onPress={() => {
          setSearchModalVisible(false);

          router.push(`/quiz/${item.quizID}`);
        }}
        style={styles.quizTouchable}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={{ color: "#6B7280" }}>
              Search quizzes by ID or title...
            </Text>
          </TouchableOpacity>

          {/* User's Quiz List */}
          <FlatList
            data={myQuizes}
            keyExtractor={(item) => item.quizID}
            renderItem={renderQuizItem}
            contentContainerStyle={styles.listContainer}
          />

          {/* Add Quiz Button */}
          <TouchableOpacity style={styles.plusButton} onPress={handlePlusPress}>
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>

          {/* Search Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={searchModalVisible}
            onRequestClose={() => setSearchModalVisible(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setSearchModalVisible(false)}
            >
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <TextInput
                placeholder="Type ID or title..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                autoFocus
              />
              <FlatList
                data={filteredQuizzes}
                keyExtractor={(item) => item.quizID}
                renderItem={renderQuizItem}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSearchModalVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  quizTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  quizSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  plusButton: {
    position: "absolute",
    bottom: 50,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  plusText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  searchBar: {
    margin: 16,
    padding: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
});
