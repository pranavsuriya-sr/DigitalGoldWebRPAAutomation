// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfRkYeJQYNVKNZxMVtNV3Nz0VHymtzaPw",
  authDomain: "appdevjaiproj.firebaseapp.com",
  databaseURL: "https://appdevjaiproj-default-rtdb.firebaseio.com",
  projectId: "appdevjaiproj",
  storageBucket: "appdevjaiproj.firebasestorage.app",
  messagingSenderId: "768287529630",
  appId: "1:768287529630:web:5172d0f55655e447acf98f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app; 