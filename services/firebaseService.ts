
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
  orderBy,
  increment,
  writeBatch,
  limit,
  serverTimestamp,
  documentId
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * =========================================================================
 * UPDATED FIRESTORE SECURITY RULES (COPY & PASTE TO FIREBASE CONSOLE):
 * =========================================================================
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // HELPER FUNCTIONS
 *     function isSignedIn() { return request.auth != null; }
 *     function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
 *     function isStaff() { return isSignedIn() && (getUserData().role == 'admin' || getUserData().role == 'content manager'); }
 *     function isAdmin() { return isSignedIn() && getUserData().role == 'admin'; }
 *
 *     // STATS TRACKING 
 *     match /appStats/global {
 *       allow read: if true;
 *       allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['totalSessions']);
 *     }
 *     match /dailyStats/{date} {
 *       // IMPORTANT: Changed 'isAdmin()' to 'isStaff()' so managers can see the graph too!
 *       allow read: if isStaff();
 *       // Allow public creation and increment of count
 *       allow create, update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['count']);
 *     }
 *
 *     // REST OF YOUR RULES... (Keep the ones you already have)
 *     match /places/{placeId} {
 *       allow read: if true;
 *       allow write: if isStaff();
 *       allow update: if isSignedIn() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['rating', 'ratingCount', 'favoritesCount']);
 *     }
 *     match /aboutCity/{docId} {
 *       allow read: if true;
 *       allow write: if isStaff();
 *       allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readingCount']);
 *     }
 *     match /appConfig/{configId} {
 *       allow read: if true;
 *       allow write: if isAdmin();
 *     }
 *     match /users/{userId} {
 *       allow get: if isSignedIn() && (request.auth.uid == userId || isAdmin());
 *       allow list: if isAdmin();
 *       allow create: if isSignedIn() && request.auth.uid == userId && request.resource.data.role == 'visitor';
 *       allow update: if isAdmin() || (isSignedIn() && request.auth.uid == userId && request.resource.data.role == resource.data.role);
 *     }
 *     match /reviews/{reviewId} {
 *       allow read: if true;
 *       allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
 *       allow update, delete: if isSignedIn() && (request.auth.uid == resource.data.userId || isAdmin());
 *     }
 *   }
 * }
 */

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
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  writeBatch,
  limit,
  serverTimestamp,
  documentId
};
