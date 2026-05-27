import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail,
  setPersistence, browserSessionPersistence }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, query, where, serverTimestamp, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyCeAv8xFQ3feKVw80mcBY3FzJ68txtrfpw",
  authDomain: "ferco-planes-staging.firebaseapp.com",
  projectId: "ferco-planes-staging",
  storageBucket: "ferco-planes-staging.firebasestorage.app",
  messagingSenderId: "1098409172245",
  appId: "1:1098409172245:web:f2dc381acdac3f4c325d1c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
await setPersistence(auth, browserSessionPersistence);
export const db = getFirestore(app);
export const storage = getStorage(app);