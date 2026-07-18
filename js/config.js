// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  collection,
  doc,
  setDoc,
  getFirestore,
  addDoc,
  query,
  getDocs,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZhaI7tk704sHI2c0foZWWntVPyGSgQAY",
  authDomain: "mhoa-mindxproject.firebaseapp.com",
  projectId: "mhoa-mindxproject",
  storageBucket: "mhoa-mindxproject.firebasestorage.app",
  messagingSenderId: "980134646204",
  appId: "1:980134646204:web:01606d6596a8319e1c1bb9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  signInWithPopup,
  GoogleAuthProvider,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  onSnapshot,
  db,
  getDoc,
};
