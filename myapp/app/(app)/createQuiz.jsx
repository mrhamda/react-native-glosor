import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
} from "react-native";

import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH, readData, writeData } from "../../FirebaseConfig";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";

export default function CreateQuiz() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [firstLanguage, setFirstLanguage] = useState("");
  const [secondLanguage, setSecondLanguage] = useState("");
  const [wordPairs, setWordPairs] = useState([{ first: "", second: "" }]);
  const [visibility, setVisibility] = useState("private"); // default
  const { quizID } = useLocalSearchParams();
  const [languages, setLanguages] = useState([]);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  const [modalVisible1, setModalVisible1] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(
          "https://api.npoint.io/2e86aaedcad6cf50349f"
        );
        setLanguages(response.data);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };

    fetchLanguages();
  }, []);

  const filteredLanguages1 = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(search1.toLowerCase()) ||
      lang.native.toLowerCase().includes(search1.toLowerCase())
  );

  const filteredLanguages2 = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(search2.toLowerCase()) ||
      lang.native.toLowerCase().includes(search2.toLowerCase())
  );

  const selectLanguage1 = (lang) => {
    setFirstLanguage(lang.name);
    setModalVisible1(false);
  };

  const selectLanguage2 = (lang) => {
    setSecondLanguage(lang.name);
    setModalVisible2(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          const userData = await readData(`/users/${currentUser.uid}`);
          setUserData(userData);
        }

        if (quizID !== undefined) {
          const data = await readData(`/quizes/${quizID}`);

          setFirstLanguage(data.firstLanguage);
          setSecondLanguage(data.secondLanguage);
          setTitle(data.title);
          setVisibility(data.visibility);
          setWordPairs(data.wordPairs);

          console.log(data);
        }
      }
    );
    return unsubscribe;
  }, []);

  const handleNextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const filteredPairs = wordPairs.filter(
      (pair) => pair.first.trim() !== "" || pair.second.trim() !== ""
    );

    const quizData = {
      title,
      firstLanguage,
      secondLanguage,
      wordPairs: filteredPairs,
      visibility,
      createdBy: user?.uid,
    };

    if (quizID == undefined) {
      writeData(`/quizes/${Date.now()}/`, quizData);
      router.replace("(app)/");
    } else {
      writeData(`/quizes/${quizID}/`, quizData);
      router.replace(`(app)/quiz/${quizID}`);
    }
  };

  const handleAddWordPair = () => {
    setWordPairs([...wordPairs, { first: "", second: "" }]);
  };

  const handleChangeWordPair = (index, field, value) => {
    const newPairs = [...wordPairs];
    newPairs[index][field] = value;
    setWordPairs(newPairs);
  };

  const handleDeleteWordPair = (index) => {
    const newPairs = wordPairs.filter((_, i) => i !== index);
    setWordPairs(newPairs);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please log in to create a quiz</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.centerContainer}>
            <View style={styles.quizBox}>
              {/* Step 1: Title */}
              {step === 1 && (
                <>
                  <Text style={styles.title}>Step 1: Quiz Title</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter quiz title"
                  />
                  <View style={styles.arrowButtonRow}>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handleNextStep}
                    >
                      <MaterialIcons
                        name="arrow-forward"
                        size={28}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 2: Choose Languages */}
              {step === 2 && (
                <>
                  <Text style={styles.title}>Step 2: Choose Languages</Text>
                  <View style={{ flex: 1, padding: 20 }}>
                    {/* First Language */}
                    <Text style={styles.label}>First Language</Text>
                    <TouchableOpacity onPress={() => setModalVisible1(true)}>
                      <TextInput
                        style={styles.input}
                        value={firstLanguage}
                        placeholder="Select first language"
                        editable={false}
                      />
                    </TouchableOpacity>

                    <Modal visible={modalVisible1} animationType="slide">
                      <View style={{ flex: 1, padding: 20 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="Search language..."
                          value={search1}
                          onChangeText={setSearch1}
                        />
                        <FlatList
                          data={filteredLanguages1}
                          keyExtractor={(item) => item.code}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.languageItem}
                              onPress={() => selectLanguage1(item)}
                            >
                              <Text>
                                {item.name} ({item.native})
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                        <TouchableOpacity
                          style={[
                            styles.input,
                            { marginTop: 10, textAlign: "center" },
                          ]}
                          onPress={() => setModalVisible1(false)}
                        >
                          <Text>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </Modal>

                    {/* Second Language */}
                    <Text style={styles.label}>Second Language</Text>
                    <TouchableOpacity onPress={() => setModalVisible2(true)}>
                      <TextInput
                        style={styles.input}
                        value={secondLanguage}
                        placeholder="Select second language"
                        editable={false}
                      />
                    </TouchableOpacity>

                    <Modal visible={modalVisible2} animationType="slide">
                      <View style={{ flex: 1, padding: 20 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="Search language..."
                          value={search2}
                          onChangeText={setSearch2}
                        />
                        <FlatList
                          data={filteredLanguages2}
                          keyExtractor={(item) => item.code}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.languageItem}
                              onPress={() => selectLanguage2(item)}
                            >
                              <Text>
                                {item.name} ({item.native})
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                        <TouchableOpacity
                          style={[
                            styles.input,
                            { marginTop: 10, textAlign: "center" },
                          ]}
                          onPress={() => setModalVisible2(false)}
                        >
                          <Text>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </Modal>
                  </View>

                  <View style={styles.arrowButtonRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handlePrevStep}
                    >
                      <MaterialIcons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handleNextStep}
                    >
                      <MaterialIcons
                        name="arrow-forward"
                        size={28}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: Add Word Pairs */}
              {step === 3 && (
                <>
                  <Text style={styles.title}>Step 3: Add Word Pairs</Text>

                  {wordPairs.map((pair, index) => (
                    <View key={index} style={styles.wordPairRow}>
                      {/* Input Container */}
                      <View style={styles.inputsContainer}>
                        <TextInput
                          style={[styles.input, styles.rowInput]}
                          value={pair.first}
                          placeholder={firstLanguage || "First"}
                          onChangeText={(text) =>
                            handleChangeWordPair(index, "first", text)
                          }
                        />
                        <View style={styles.divider} />
                        <TextInput
                          style={[styles.input, styles.rowInput]}
                          value={pair.second}
                          placeholder={secondLanguage || "Second"}
                          onChangeText={(text) =>
                            handleChangeWordPair(index, "second", text)
                          }
                        />
                      </View>

                      {/* Improved Delete button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteWordPair(index)}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={24}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Improved Plus button */}
                  <TouchableOpacity
                    onPress={handleAddWordPair}
                    style={styles.addButton}
                  >
                    <MaterialIcons name="add" size={30} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.arrowButtonRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handlePrevStep}
                    >
                      <MaterialIcons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handleNextStep}
                    >
                      <MaterialIcons
                        name="arrow-forward"
                        size={28}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 4: Choose Visibility */}
              {step === 4 && (
                <>
                  <Text style={styles.title}>Step 4: Choose Visibility</Text>
                  <View style={styles.visibilityRow}>
                    <TouchableOpacity
                      style={[
                        styles.visibilityOption,
                        visibility === "public" &&
                          styles.visibilitySelectedPublic,
                      ]}
                      onPress={() => setVisibility("public")}
                    >
                      <Text
                        style={[
                          styles.visibilityText,
                          visibility === "public" &&
                            styles.visibilityTextSelectedPublic,
                        ]}
                      >
                        Public
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.visibilityOption,
                        visibility === "private" &&
                          styles.visibilitySelectedPrivate,
                      ]}
                      onPress={() => setVisibility("private")}
                    >
                      <Text
                        style={[
                          styles.visibilityText,
                          visibility === "private" &&
                            styles.visibilityTextSelectedPrivate,
                        ]}
                      >
                        Private
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.arrowButtonRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handlePrevStep}
                    >
                      <MaterialIcons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handleNextStep}
                    >
                      <MaterialIcons
                        name="arrow-forward"
                        size={28}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <>
                  <Text style={styles.title}>Step 5: Review & Submit</Text>

                  <View style={styles.reviewBox}>
                    <Text style={styles.reviewLabel}>Quiz Title</Text>
                    <Text style={styles.reviewValue}>{title || "-"}</Text>

                    <Text style={styles.reviewLabel}>Languages</Text>
                    <Text style={styles.reviewValue}>
                      {firstLanguage || "-"} ↔ {secondLanguage || "-"}
                    </Text>

                    <Text style={styles.reviewLabel}>Visibility</Text>
                    <Text style={styles.reviewValue}>
                      {visibility === "public" ? "Public" : "Private"}
                    </Text>

                    <Text style={styles.reviewLabel}>Word Pairs</Text>
                    {wordPairs
                      .filter(
                        (pair) =>
                          pair.first.trim() !== "" || pair.second.trim() !== ""
                      )
                      .map((pair, index) => (
                        <View key={index} style={styles.wordPairItem}>
                          <Text style={styles.wordPairText}>
                            {pair.first || "-"}
                          </Text>
                          <Text style={styles.wordPairArrow}>↔</Text>
                          <Text style={styles.wordPairText}>
                            {pair.second || "-"}
                          </Text>
                        </View>
                      ))}
                  </View>

                  <View style={styles.arrowButtonRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handlePrevStep}
                    >
                      <MaterialIcons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handleSubmit}
                    >
                      <MaterialIcons name="check" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // --- Visibility & Selection Styles ---
  visibilityTextSelectedPublic: {
    color: "#FFFFFF",
  },
  visibilityTextSelectedPrivate: {
    color: "#FFFFFF",
  },
  visibilitySelectedPrivate: {
    backgroundColor: "#F87171",
    borderColor: "#EF4444",
  },
  visibilitySelectedPublic: {
    backgroundColor: "#34D399",
    borderColor: "#10B981",
  },
  visibilityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 20,
  },
  visibilityOption: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  visibilitySelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  visibilityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  visibilityTextSelected: {
    color: "#FFFFFF",
  },

  // --- Layout Containers ---
  scrollContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  quizBox: {
    backgroundColor: "#FFFFFF",
    width: 340,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },

  // --- Typography & Global Inputs ---
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1F2937",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#374151",
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    fontSize: 16,
    marginBottom: 10,
  },

  // --- Step 3: Modern Word Pair Styles ---
  wordPairRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  inputsContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
    alignItems: "center",
  },
  rowInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    marginBottom: 0, // Override global input margin
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: "#D1D5DB",
  },
  deleteButton: {
    width: 40,
    height: 40,
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  addButton: {
    width: 54,
    height: 54,
    backgroundColor: "#10B981",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },

  // --- Navigation & Arrows ---
  arrowButtonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 10,
  },
  arrowButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  languageRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
  },
  languageItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  // --- Review Step Styles ---
  reviewBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 10,
  },
  reviewValue: {
    fontSize: 18,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 5,
  },
  wordPairItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  wordPairText: {
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  wordPairArrow: {
    fontSize: 18,
    color: "#9CA3AF",
    marginHorizontal: 8,
  },
});
