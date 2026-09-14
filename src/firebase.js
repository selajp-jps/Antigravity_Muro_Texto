import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDEzEW03OccBfD30gqWCxWJOVEeXEy4Sq0",
  authDomain: "muro-clases.firebaseapp.com",
  projectId: "muro-clases",
  storageBucket: "muro-clases.firebasestorage.app",
  messagingSenderId: "371994337240",
  appId: "1:371994337240:web:fc753077430c1b3e799cad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;
