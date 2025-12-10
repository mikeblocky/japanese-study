// Firebase configuration for Japanese Study Management App
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBAh6MErPn3O2qxn2DirQqV_qVP0LbGAVo",
    authDomain: "japanese-management.firebaseapp.com",
    projectId: "japanese-management",
    storageBucket: "japanese-management.firebasestorage.app",
    messagingSenderId: "941011637982",
    appId: "1:941011637982:web:5a03828f6ae7f861c6944f",
    measurementId: "G-RL76KWS8X3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
    .then(() => {
        console.log('Firestore offline persistence enabled');
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not available in this browser');
        } else {
            console.warn('Firestore persistence error:', err);
        }
    });

export { app, analytics, db, auth };
export default app;
