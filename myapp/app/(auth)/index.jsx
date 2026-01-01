import { Text, View, StyleSheet, TouchableOpacity } from "react-native";

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH } from "@/FirebaseConfig";

export default function Index() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(app)/home");
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.title}>Welcome</Text>

        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/signup")}
          style={[styles.button, styles.signupButton]}
        >
          <Text style={[styles.buttonText, styles.signupText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5", // very light gray background
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
    color: "#1F2937", // dark gray title for contrast
  },

  button: {
    width: "80%",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E5E7EB", // light gray button
    alignItems: "center",
    marginBottom: 20,
  },

  signupButton: {
    backgroundColor: "#D1D5DB", // slightly darker gray for signup
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937", // dark gray text
  },

  signupText: {
    color: "#3B82F6", // blue accent for signup
  },
});
