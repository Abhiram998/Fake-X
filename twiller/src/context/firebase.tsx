
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// keep your credentials 
const firebaseConfig = {
  apiKey: "AIzaSyCWBkeUGf81FMRKJdMO7zI1cNIGF61jYAo",
  authDomain: "fake-x-2ef1b.firebaseapp.com",
  projectId: "fake-x-2ef1b",
  storageBucket: "fake-x-2ef1b.firebasestorage.app",
  messagingSenderId: "97705321188",
  appId: "1:97705321188:web:fea342ba4723ddbfbe02f1"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
