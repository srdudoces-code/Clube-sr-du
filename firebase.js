import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAhsYGochAukUqq3vkhUYrvK2ssYXrKCIE",
    authDomain: "clubesrdu.firebaseapp.com",
    projectId: "clubesrdu",
    storageBucket: "clubesrdu.firebasestorage.app",
    messagingSenderId: "933585878132",
    appId: "1:933585878132:web:ef653436a8ba056d7ca521"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
    db,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit
};