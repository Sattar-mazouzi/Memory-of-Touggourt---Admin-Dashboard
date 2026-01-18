
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Touggourt Memory Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAw7HKjC_T9j77JC-oPL8Id6P9Z7SGbBhQ",
  authDomain: "touggourtmemory.firebaseapp.com",
  projectId: "touggourtmemory",
  storageBucket: "touggourtmemory.firebasestorage.app",
  messagingSenderId: "541554280419",
  appId: "1:541554280419:web:dd5bf251cf7dc801ecc2d6",
  measurementId: "G-PSK62Z130E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy
};
