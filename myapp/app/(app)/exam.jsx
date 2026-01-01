import React, { useState, useCallback, useEffect } from "react";
import { API_URL } from "../../config.js";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Alert,
  Modal,
  AppState,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import {
  FIREBASE_AUTH,
  readData,
  removeData,
  writeData,
} from "../../FirebaseConfig";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function Exam() {
  const [user, setUser] = useState(null);
  const [myQuizes, setMyQuizes] = useState([]);
  const [choice, setChoice] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [examType, setExamType] = useState(null);
  const [languageChoice, setLanguageChoice] = useState(null);
  const [examId, setExamId] = useState("");
  const [joinExamId, setJoinExamId] = useState("");

  const [sessionActive, setSessionActive] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [role, setRole] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [currentTeacherId, setCurrentTeacherId] = useState(null);

  const [viewingStudent, setViewingStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const router = useRouter();

  const TimeOut = async (targetPath, delayMs) => {
    try {
      await fetch(`${API_URL}/timeout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time: delayMs,
          target: targetPath,
        }),
      });
    } catch (error) {
      console.error("Error calling timeout route:", error);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        role === "teacher" &&
        sessionActive &&
        examId &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        TimeOut(`/exams_open/${examId}`, 5000);
        TimeOut(`/exams_runing/${examId}`, 5000);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [role, sessionActive, examId]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(
        FIREBASE_AUTH,
        async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            const allQuizzes = (await readData("/quizes/")) || {};
            const userQuizzes = Object.entries(allQuizzes)
              .filter(([key, quiz]) => quiz.createdBy === currentUser.uid)
              .map(([key, quiz]) => ({ quizID: key, ...quiz }));
            setMyQuizes(userQuizzes);
          }
        }
      );
      return unsubscribe;
    }, [])
  );

  useEffect(() => {
    let interval;
    if (sessionActive && examId) {
      const fetchData = async () => {
        const runningData = await readData(`/exams_runing/${examId}`);
        const openData = await readData(`/exams_open/${examId}`);
        const activeRoom = runningData || openData;

        if (activeRoom && role === "student" && user) {
          const isStillInRoom =
            activeRoom.users && activeRoom.users.includes(user.uid);
          if (!isStillInRoom) {
            clearInterval(interval);
            setSessionActive(false);
            setIsStarted(false);
            setRole(null);
            setChoice(null); 
            setExamId("");
            Alert.alert(
              "Notice",
              "You have been removed from the exam session."
            );
            return;
          }
        }

        if (runningData) {
          setCurrentTeacherId(runningData.teacherId);
          if (role === "student" && !isStarted) {
            setIsStarted(true);
            const routeName =
              runningData.type === "writing" ? "/write" : "/alternatives";
            const quizData = await readData(`/quizes/${runningData.quizID}`);
            const parsedPairs = (quizData.wordPairs || []).map((item) => ({
              ...item,
              selected: true,
            }));
            router.replace({
              pathname: routeName,
              params: {
                wordPairs: JSON.stringify(parsedPairs),
                language: runningData.language,
                firstLanguage: quizData.firstLanguage,
                secondLanguage: quizData.secondLanguage,
                examId: examId,
              },
            });
          }
          syncParticipants(runningData.users);
          const finishedData = (await readData(`/exams_end/${examId}`)) || {};
          setSubmissions(finishedData);
        } else {
          if (openData) {
            setCurrentTeacherId(openData.teacherId);
            syncParticipants(openData.users);
          } else if (role === "student") {
            setSessionActive(false);
            setChoice(null);
          }
        }
      };

      const syncParticipants = async (uids) => {
        if (!uids) return;
        const userDetails = await Promise.all(
          uids.map(async (uid) => {
            const profile = await readData(`/users/${uid}`);
            return {
              uid,
              name: profile?.name || "Anonymous",
              avatar: profile?.avatar ? `${API_URL}${profile.avatar}` : null,
            };
          })
        );
        setParticipants(userDetails);
      };

      fetchData();
      interval = setInterval(fetchData, 3000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, examId, isStarted, role, user]);

  const makeExamSession = async () => {
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setExamId(newId);

    try {
      await writeData(`/exams_open/${newId}`, {
        id: newId,
        quizID: selectedQuiz.quizID,
        type: examType,
        language: languageChoice,
        users: [user.uid],
        teacherId: user.uid,
      });

      setRole("teacher");
      setSessionActive(true);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const join_Exam = async () => {
    const room = await readData(`/exams_open/${joinExamId}`);
    if (room) {
      const currentUsers = room.users || [];
      if (!currentUsers.includes(user.uid)) {
        await writeData(`/exams_open/${joinExamId}`, {
          ...room,
          users: [...currentUsers, user.uid],
        });
      }
      setExamId(joinExamId);
      setRole("student");
      setSessionActive(true);
    } else {
      Alert.alert("Error", "Invalid Exam ID.");
    }
  };

  const beginExamSession = async () => {
    const currentData = await readData(`/exams_open/${examId}`);
    if (currentData) {
      await writeData(`/exams_runing/${examId}`, { ...currentData });
      await removeData(`/exams_open/${examId}`);
      setIsStarted(true);
    }
  };

  const destroySession = async () => {
    await removeData(`/exams_open/${examId}`);
    await removeData(`/exams_runing/${examId}`);
    setSessionActive(false);
    setIsStarted(false);
    setRole(null);
    setChoice(null);
    setSelectedQuiz(null);
    setExamType(null);
    setLanguageChoice(null);
  };

  const handleKick = async (targetUid) => {
    const path = `/exams_open/${examId}`;
    const currentData = await readData(path);
    if (currentData) {
      const updatedUsers = currentData.users.filter((id) => id !== targetUid);
      await writeData(path, { ...currentData, users: updatedUsers });
    }
  };

  const openStudentResults = (student) => {
    if (submissions[student.uid]) {
      setViewingStudent({ ...student, results: submissions[student.uid] });
      setModalVisible(true);
    }
  };

  if (sessionActive) {
    const visibleParticipants =
      role === "student"
        ? participants.filter((p) => p.uid !== currentTeacherId)
        : participants;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isStarted ? "Exam Live" : "Waiting Room"}
          </Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>ID: {examId}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollArea}>
          <Text style={styles.sectionHeader}>
            {isStarted ? "Results / Status" : "Participants Joined"} (
            {visibleParticipants.length})
          </Text>

          {visibleParticipants.map((p, index) => {
            const submission = submissions[p.uid];
            const isTeacher = p.uid === currentTeacherId;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.participantRow,
                  isTeacher && { backgroundColor: "#EFF6FF" },
                ]}
                onPress={() => role === "teacher" && openStudentResults(p)}
                disabled={role !== "teacher" || !submission || isTeacher}
              >
                {p.avatar ? (
                  <Image source={{ uri: p.avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <FontAwesome5 name="user" size={14} color="#94A3B8" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowText}>
                    {p.name} {isTeacher ? "(Teacher)" : ""}
                  </Text>
                  {isStarted && !isTeacher && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: submission ? "#10B981" : "#F59E0B",
                        fontWeight: "500",
                        marginTop: 2,
                      }}
                    >
                      {submission
                        ? `✓ Score: ${submission.score}/${submission.total}`
                        : "• Taking Exam..."}
                    </Text>
                  )}
                </View>
                {role === "teacher" && !isStarted && p.uid !== user.uid && (
                  <TouchableOpacity onPress={() => handleKick(p.uid)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                )}
                {role === "teacher" && submission && !isTeacher && (
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#3B82F6"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {viewingStudent?.name}'s Answers
              </Text>
              <ScrollView>
                {viewingStudent?.results?.details?.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.detailItem,
                      { borderColor: item.isCorrect ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    <Text style={styles.detailWord}>{item.word}</Text>
                    <Text style={{ color: "#4B5563" }}>
                      Answered:{" "}
                      <Text
                        style={{
                          fontWeight: "bold",
                          color: item.isCorrect ? "#059669" : "#DC2626",
                        }}
                      >
                        {item.userAnswer || "(Empty)"}
                      </Text>
                    </Text>
                    {!item.isCorrect && (
                      <Text style={{ color: "#10B981", fontSize: 12 }}>
                        Correct: {item.correctAnswer}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnTextWhite}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {role === "teacher" && (
          <View style={styles.teacherControls}>
            {!isStarted && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: "#10B981" }]}
                onPress={beginExamSession}
              >
                <Text style={styles.btnTextWhite}>Start Exam</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: "#EF4444", marginTop: 15 },
              ]}
              onPress={destroySession}
            >
              <Text style={styles.btnTextWhite}>Close Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (!choice) {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="assignment" size={40} color="#3B82F6" />
        </View>
        <Text style={styles.title}>Exam Mode</Text>
        <Text style={styles.subtitle}>Host a session or join as a student</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => setChoice("make")}
        >
          <MaterialIcons name="add-box" size={26} color="#3B82F6" />
          <Text style={styles.optionTitle}>Host Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { marginTop: 15 }]}
          onPress={() => setChoice("join")}
        >
          <MaterialIcons name="group-add" size={26} color="#10B981" />
          <Text style={styles.optionTitle}>Join Exam</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (choice === "join") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Exam ID</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code shared by teacher
        </Text>
        <TextInput
          placeholder="ABCDEF"
          value={joinExamId}
          onChangeText={setJoinExamId}
          style={styles.input}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={join_Exam}>
          <Text style={styles.btnTextWhite}>Join Lobby</Text>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => setChoice(null)}
            style={styles.backButtonContainer}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (choice === "make" && !selectedQuiz) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Quiz</Text>
        <Text style={styles.subtitle}>
          Choose which list to test students on
        </Text>

        <FlatList
          data={myQuizes}
          keyExtractor={(item) => item.quizID}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quizCard}
              onPress={() => setSelectedQuiz(item)}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={styles.quizTitle}>{item.title}</Text>
                <Text style={styles.quizSubtitle}>
                  {item.firstLanguage} • {item.secondLanguage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          style={{ width: "100%", marginTop: 25 }}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => setChoice(null)}
            style={styles.backButtonContainer}
          >
            <Text style={styles.cancelText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (selectedQuiz && !examType) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Exam Type</Text>
        <Text style={styles.subtitle}>How should students answer?</Text>

        <TouchableOpacity
          style={[styles.optionCard, { justifyContent: "center" }]}
          onPress={() => setExamType("writing")}
        >
          <Text style={styles.optionTitle}>Writing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            { marginTop: 15, justifyContent: "center" },
          ]}
          onPress={() => setExamType("alternatives")}
        >
          <Text style={styles.optionTitle}>Alternatives</Text>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => setSelectedQuiz(null)}
            style={styles.backButtonContainer}
          >
            <Text style={styles.cancelText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (examType && !languageChoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Target Language</Text>
        <Text style={styles.subtitle}>
          Which language are they translating TO?
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { justifyContent: "center" }]}
          onPress={() => setLanguageChoice("first")}
        >
          <Text style={styles.optionTitle}>{selectedQuiz.firstLanguage}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            { marginTop: 15, justifyContent: "center" },
          ]}
          onPress={() => setLanguageChoice("second")}
        >
          <Text style={styles.optionTitle}>{selectedQuiz.secondLanguage}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            { marginTop: 15, justifyContent: "center" },
          ]}
          onPress={() => setLanguageChoice("both")}
        >
          <Text style={styles.optionTitle}>Mixed (Both)</Text>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => setExamType(null)}
            style={styles.backButtonContainer}
          >
            <Text style={styles.cancelText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (languageChoice) {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="check-circle" size={40} color="#10B981" />
        </View>
        <Text style={styles.title}>Session Ready</Text>
        <Text style={styles.subtitle}>
          Click below to generate the join code
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={makeExamSession}
        >
          <Text style={styles.btnTextWhite}>Open Room</Text>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => setLanguageChoice(null)}
            style={styles.backButtonContainer}
          >
            <Text style={styles.cancelText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 45,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  idBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  idText: {
    fontWeight: "900",
    color: "#3B82F6",
    fontSize: 24,
    letterSpacing: 1.5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 12,
  },
  scrollArea: {
    width: "100%",
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rowText: { fontSize: 16, fontWeight: "600", color: "#334155" },
  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 18,
    borderRadius: 18,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnTextWhite: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  bottomNav: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
    position: "absolute",
    bottom: 20,
  },
  backButtonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    backgroundColor: "#FFF1F2", 
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelText: {
    color: "#EF4444",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 18,
    width: "100%",
    marginBottom: 24,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  quizCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 20,
    marginBottom: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  quizTitle: {
    fontWeight: "800",
    fontSize: 19,
    color: "#1E293B",
    textAlign: "center",
  },
  quizSubtitle: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 30,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    color: "#1E293B",
  },
  detailItem: {
    padding: 16,
    borderLeftWidth: 5,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  detailWord: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 4,
  },
  closeBtn: {
    backgroundColor: "#1E293B",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  teacherControls: {
    width: "100%",
    marginTop: 20,
    paddingBottom: 20,
  },
});
