import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase, ref, set, get, remove } from "firebase/database";

// Firebase config

const firebaseConfig = {
  apiKey: ,
  authDomain: ,
  projectId: ,
  databaseURL: ,
  storageBucket: ,
  messagingSenderId: ,
  appId: ,
  measurementId: ,
};

export const FIREBASE_APP = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const FIREBASE_AUTH =
  getApps().length > 0
    ? initializeAuth(FIREBASE_APP, { persistence: getReactNativePersistence(AsyncStorage) })
    : initializeAuth(FIREBASE_APP, { persistence: getReactNativePersistence(AsyncStorage) });

export function writeData(path, data) {
  const db = getDatabase();
  const reference = ref(db, path);
  return set(reference, data);
}

export async function readData(path) {
  const db = getDatabase();
  const reference = ref(db, path);
  const snapshot = await get(reference);
  return snapshot.val();
}


export function removeData(path) {
  const db = getDatabase();
  const reference = ref(db, path);
  return remove(reference);
}

