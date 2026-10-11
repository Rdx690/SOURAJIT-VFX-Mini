// Firebase web config for SOURAJIT VFX Mini.
// Keep Firestore Security Rules enabled; this config is not an authorization boundary.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDS1D9g9dToIQbrRiMwvgQci7cQM9THykc",
  authDomain: "sourajit-vfx.firebaseapp.com",
  projectId: "sourajit-vfx",
  storageBucket: "sourajit-vfx.firebasestorage.app",
  messagingSenderId: "255333519003",
  appId: "1:255333519003:web:f306ee62984a101756c03e",
  measurementId: "G-VXB0Z87FS3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
