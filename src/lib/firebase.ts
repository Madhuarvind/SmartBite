// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "smartbite-rknzs",
  appId: "1:380749375700:web:258d9ed45d8920e6dab341",
  storageBucket: "smartbite-rknzs.firebasestorage.app",
  apiKey: "AIzaSyBfs1cx6ucShd9QbK6hCk3M3yGDMcB2bKQ",
  authDomain: "smartbite-rknzs.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "380749375700"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

export { app, auth };
