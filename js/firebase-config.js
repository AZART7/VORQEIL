// Firebase Configuration for VORQEIL Platform
// This file initializes Firebase and exports shared instances

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot, arrayUnion, increment, orderBy, limit, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB4QtkhGenKmg5IF0001rV2g7asfSXCCRY",
    authDomain: "vorqeil.firebaseapp.com",
    projectId: "vorqeil",
    storageBucket: "vorqeil.firebasestorage.app",
    messagingSenderId: "533299397585",
    appId: "1:533299397585:web:640646ea30e7bd678216f0",
    measurementId: "G-KGB0JX6D84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Set auth persistence
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Export all Firebase services
export {
    app,
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    onSnapshot,
    arrayUnion,
    increment,
    orderBy,
    limit,
    deleteDoc,
    addDoc
};