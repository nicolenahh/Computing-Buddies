import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
// import {...} from "firebase/database";
import { getFirestore } from "firebase/firestore";
// import {...} from "firebase/functions";
// import {...} from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBZ4ZZiQUEm7Ikz2nttyZ6CeXGmTd42O9o',
  authDomain: 'study-buddy-b2615.firebaseapp.com',
  databaseURL: 'https://study-buddy-b2615.firebaseio.com',
  projectId: 'study-buddy-b2615',
  storageBucket: 'study-buddy-b2615.appspot.com',
  messagingSenderId: '796244150491',
  appId: '1:796244150491:web:22a99ec1561fb5bf0fa4fe',
  // measurementId: 'G-measurement-id',
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
