# Abdullah Hamdan React-native-Glosor

A cross-platform mobile application built with React Native designed to help users learn and practice vocabulary (Glosor). This app provides an intuitive interface for managing word lists and testing knowledge through interactive quizzes.

## Features

Custom Vocabulary Lists: Create, edit, and delete your own sets of words.

Practice Mode: Test your knowledge with a built in quiz system.

Progress Tracking: Keep track of which words you have mastered.

Cross Platform: Runs seamlessly on both iOS and Android.

Exam mode: The teacher can make an exam to test the students knowledge!

Sign Up: Users can create an account using email/password.

Login: Secure access to personal vocabulary lists.

Password Recovery: "Forget Password" functionality via automated email reset links.

## Implementation Guide

Network Configuration: First you must enter your computer's IPv4 address into the config.js file.

Firebase Setup: Place the necessary Firebase configuration details in the FirebaseConfig.js file.

Start the Server: Launch the backend server by running:

```
npm run server
```

Start the App: Launch the Expo application using:

```
npx expo start
```

## Stack

Frontend (Mobile)
Framework: React Native (Expo), cross-platform development.

Routing: Expo Router File based routing for seamless navigation.

Styling: React Native StyleSheet.

Backend & Services
Authentication: Firebase Authentication Secure login, signup, and password recovery.

Database: Firebase Realtime Database – Real-time synchronization of vocabulary assignments.

Server: Node.js & Express.js Custom backend logic and API management.

File Uploads: Multer Middleware for handling multipart/form-data (used for uploading images or files to the server).