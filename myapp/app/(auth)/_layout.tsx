import { Stack } from "expo-router";
import { StatusBar, View } from "react-native";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "rgba(255,255,255,0.1)" }, // semi-transparent
        }}
      >
        <Stack.Screen name="index" options={{ headerTitle: "Welcome" }} />
        <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
        <Stack.Screen name="signup" options={{ headerTitle: "Signup" }} />
      </Stack>
    </View>
  );
}
