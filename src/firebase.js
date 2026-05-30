import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  linkWithPopup, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  where, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  writeBatch 
} from "firebase/firestore";

const manualConfig = {
    apiKey: "AIzaSyAkhtbrwMz_PYOracCT6vB8T4pEm-5Txo8",
    authDomain: "backofficedelfinacon.firebaseapp.com",
    projectId: "backofficedelfinacon",
    storageBucket: "backofficedelfinacon.firebasestorage.app",
    messagingSenderId: "519349252286",
    appId: "1:519349252286:web:d4be083c9117e14aa9eeef",
    measurementId: "G-HHYG516JMK"
};

// Selección de configuración
let firebaseConfig = manualConfig;
if (typeof __firebase_config !== 'undefined') {
    try {
        firebaseConfig = JSON.parse(__firebase_config);
    } catch (e) {
        console.warn("Error parseando __firebase_config:", e);
    }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    console.log("💾 Persistencia offline de Firestore activada con éxito.");
} catch (e) {
    console.warn("⚠️ No se pudo inicializar la persistencia offline, usando getFirestore estándar:", e);
    db = getFirestore(app);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'delfina-concept-prod';

export {
    auth,
    db,
    appId,
    collection,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    where,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    GoogleAuthProvider,
    linkWithPopup,
    signInWithPopup,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
};
