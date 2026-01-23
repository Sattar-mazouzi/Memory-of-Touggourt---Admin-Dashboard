
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
  setDoc,
  deleteDoc, 
  getDocs, 
  getDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * =========================================================================
 * FIRESTORE SECURITY RULES (COPY & PASTE TO FIREBASE CONSOLE):
 * =========================================================================
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     
 *     // Helper: Check if user has a staff role (admin or content manager)
 *     function isStaff() {
 *       return request.auth != null && 
 *         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
 *         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'content manager']);
 *     }
 *
 *     // Helper: Check if user is an admin
 *     function isAdmin() {
 *       return request.auth != null && 
 *         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
 *         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
 *     }
 *
 *     // Users collection
 *     match /users/{userId} {
 *       allow read: if request.auth != null;
 *       allow write: if isAdmin() || (request.auth != null && request.auth.uid == userId);
 *     }
 *
 *     // App Configuration (Categories, etc.) - PUBLIC READ
 *     match /appConfig/{configId} {
 *       allow read: if true;
 *       allow write: if isAdmin();
 *     }
 *
 *     // Places collection - PUBLIC READ, STAFF WRITE
 *     match /places/{placeId} {
 *       allow read: if true;
 *       allow write: if isStaff();
 *     }
 *
 *     // About City articles - PUBLIC READ, STAFF WRITE
 *     match /aboutCity/{articleId} {
 *       allow read: if true;
 *       allow write: if isStaff();
 *     }
 *   }
 * }
 */

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

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Initialize and export services
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
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy
};
