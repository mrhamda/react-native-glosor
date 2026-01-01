import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Alert } from "react-native";

import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { FIREBASE_AUTH } from "../../FirebaseConfig";

import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
      Alert.alert(
        "Success",
        "Password reset email sent! Check your inbox. try checking the spam folder if u don't see the message."
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // FIX FORGOT PASSWORD
  // FIX THE TIME NOT VIISBLE ON WHITE
  // FIX SAVES WHEN LOGGING IN

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password validation: at least 8 chars, 1 uppercase, 1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be 8+ characters, include 1 uppercase and 1 special character"
      );
      return;
    }

    const userCredential = await signInWithEmailAndPassword(
      FIREBASE_AUTH,
      email,
      password
    );

    router.replace("/(app)/home");

    setEmail("");
    setPassword("");
    setSuccess("Logged in successfully!");
    

    await AsyncStorage.setItem("user", JSON.stringify(userCredential));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.centerContainer}>
            <View style={styles.loginBox}>
              <Text style={styles.title}>Login</Text>

              <TextInput
                style={[styles.input, { marginBottom: 20 }]}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                selectionColor="#3B82F6"
              />

              <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                selectionColor="#3B82F6"
              />

              <TouchableOpacity
                onPress={handleForgotPassword}
                style={{ marginBottom: 20 }}
              >
                <Text style={{ color: "#3B82F6", fontWeight: "500" }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? (
                <Text style={styles.successText}>{success}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#ECECEC", // light grayish-white background
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#ECECEC", // match scroll background
  },

  loginBox: {
    backgroundColor: "#FFFFFF", // white login box
    width: 320,
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

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#1F2937", // dark gray for visibility
  },

  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#C4C4C4", // light gray border
    borderRadius: 10,
    color: "#1F2937", // dark text on light input
    backgroundColor: "#F9F9F9", // very light gray input background
    fontSize: 16,
    marginBottom: 20,
  },

  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  errorText: {
    color: "#EF4444", // red for errors
    marginBottom: 10,
    fontSize: 14,
    textAlign: "center",
  },

  successText: {
    color: "#10B981", // green for success
    marginBottom: 10,
    fontSize: 14,
    textAlign: "center",
  },
});
