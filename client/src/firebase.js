import { initializeApp } from "firebase/app";

import {
  getStorage
} from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyDZGAM4xlIf3Mzg3JrRVvf2eB_YHPvYXwU",
  authDomain: "college-project-4e69b.firebaseapp.com",
  databaseURL: "https://college-project-4e69b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "college-project-4e69b",
  storageBucket: "college-project-4e69b.firebasestorage.app",
  messagingSenderId: "1023456060114",
  appId: "1:1023456060114:web:e523a4d12ddbf2682a030b",
  measurementId: "G-XVP2T3EP9C"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);

