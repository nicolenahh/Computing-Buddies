// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ4ZZiQUEm7Ikz2nttyZ6CeXGmTd42O9o",
  authDomain: "study-buddy-b2615.firebaseapp.com",
  projectId: "study-buddy-b2615",
  storageBucket: "study-buddy-b2615.appspot.com",
  messagingSenderId: "796244150491",
  appId: "1:796244150491:web:22a99ec1561fb5bf0fa4fe"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);

export const FIREBASE_DB =  getFirestore(FIREBASE_APP);