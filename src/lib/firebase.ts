// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "smartbite-rknzs",
  appId: "1:380749375700:web:258d9ed45d8920e6dab341",
  storageBucket: "smartbite-rknzs.firebasestorage.app",
  apiKey: "AIzaSyBfs1cx6ucShd9QbK6hCk3M3yGDMcB2bKQ",
  authDomain: "smartbite-rknzs.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "380749375700"
};

// Extend the Window interface
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
