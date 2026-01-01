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
  Alert,
  Button,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { FIREBASE_AUTH, readData, writeData } from "../../FirebaseConfig";
import { API_URL } from "../../config.js";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const data = await readData(`users/${currentUser.uid}`);
        setDisplayName(data.name || "");
        setSelectedImage(data.avatar || null);
        setUserData(data);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri); 
    }
  };

  const uploadAvatar = async (photoUri) => {
    const formData = new FormData();

    formData.append("photos", {
      uri: photoUri,
      name: "avatar.jpg",
      type: "image/jpeg",
    });

    if (userData.avatar && !userData.avatar.startsWith("file://")) {
      formData.append("oldPath", userData.avatar); 
    }

    try {
      const res = await fetch(`${API_URL}/photos/upload`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        const avatarPath = data.files[0].path;
        await writeData(`/users/${user.uid}/avatar`, avatarPath);
        setSelectedImage(avatarPath);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleUpdate = async () => {
    if (!displayName.trim()) {
      setErrorMessage("Name cannot be empty.");
      setSuccessMessage("");
      return;
    }

    try {
      const oldData = await readData(`/users/${user.uid}`);
      await writeData(`/users/${user.uid}`, {
        ...oldData,
        name: displayName,
      });

      if (selectedImage && !selectedImage.startsWith("/uploads")) {
        await uploadAvatar(selectedImage);
      }

      setSuccessMessage("Profile updated successfully!");
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message);
      setSuccessMessage("");
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, user.email);
      Alert.alert("Success", "Password reset email sent!");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.centerContainer}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {user ? (
            <View style={styles.loginBox}>
              <Text style={styles.title}>Profile</Text>
              <Image
                source={
                  selectedImage
                    ? selectedImage.startsWith("/uploads") || selectedImage.startsWith("http")
                      ? { uri: `${API_URL}${selectedImage}` } 
                      : { uri: selectedImage } 
                    : require("../../assets/images/noprofile.jpg")
                }
                style={styles.image}
              />
              <View style={{ paddingBottom: 20 }}>
                <Button title="Choose Image" onPress={pickImage} />
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: "#E5E7EB" }]}
                value={user.email}
                editable={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
              />

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

              <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#F59E0B" }]}
                onPress={handleResetPassword}
              >
                <Text style={styles.buttonText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text>Please log in</Text>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loginBox: {
    backgroundColor: "#FFFFFF",
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
    marginTop: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#1F2937" },
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
    marginBottom: 15,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  errorText: { color: "#EF4444", marginBottom: 10, fontSize: 14, textAlign: "center" },
  successText: { color: "#10B981", marginBottom: 10, fontSize: 14, textAlign: "center" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 20 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { height: 125, width: 125, marginBottom: 25, borderRadius: 62.5 },
});
