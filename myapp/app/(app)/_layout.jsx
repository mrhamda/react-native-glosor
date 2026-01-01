import { Stack, useRouter } from "expo-router";
import { StatusBar, Alert, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { signOut } from "firebase/auth";
import { FIREBASE_AUTH } from "../../FirebaseConfig";

export default function AppLayout() {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut(FIREBASE_AUTH);
    router.replace("/(auth)");
  };

  function handleFavs() {
    router.push("/(app)/fav");
  }

  function handleExam() {
    router.push("/(app)/exam");
  }

  // BIRD FIX

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="home"
          options={{
            headerTitle: "Home",
            headerRight: () => (
              <>
                <TouchableOpacity
                  onPress={handleExam}
                  style={{ marginRight: 15 }}
                >
                  <MaterialIcons name="assignment" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginRight: 15 }}
                  onPress={() => {
                    router.push("/(app)/profile");
                  }}
                >
                  <MaterialCommunityIcons
                    name="face-man-profile"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFavs}
                  style={{ marginRight: 15 }}
                >
                  <MaterialIcons name="favorite" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  style={{ marginRight: 15 }}
                >
                  <MaterialIcons name="logout" size={24} color="white" />
                </TouchableOpacity>
              </>
            ),
          }}
        />

        <Stack.Screen
          name="createQuiz"
          options={{
            headerTitle: "Create / Edit Quiz",
          }}
        />

        <Stack.Screen
          name="flashcards"
          options={{
            headerTitle: "Flashcards",
          }}
        />

        <Stack.Screen
          name="chooseLanuage"
          options={{
            headerTitle: "Choose Launuage",
          }}
        />

        <Stack.Screen
          name="quiz/[id]"
          options={{
            headerTitle: "Quiz",
          }}
        />

        <Stack.Screen
          name="write"
          options={{
            headerTitle: "Write",
          }}
        />

        <Stack.Screen
          name="alternatives"
          options={{
            headerTitle: "Alternatives",
          }}
        />

        <Stack.Screen
          name="bird"
          options={{
            headerTitle: "Bird",
          }}
        />

        <Stack.Screen
          name="fav"
          options={{
            headerTitle: "Favorites",
          }}
        />

        <Stack.Screen
          name="exam"
          options={{
            headerTitle: "Exam",
          }}
        />

        <Stack.Screen name="profile" options={{ headerTitle: "Profile" }} />
      </Stack>
    </>
  );
}
