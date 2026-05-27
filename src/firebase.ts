import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const puntajesRef = collection(db, "puntajes");

export async function guardarPuntajeFirebase(registro: Record<string, unknown>) {
  await addDoc(puntajesRef, {
    ...registro,
    creadoEnFirebase: new Date().toISOString(),
  });
}

export function escucharPuntajes(
  onData: (registros: Record<string, unknown>[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(puntajesRef, orderBy("timestamp", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const registros = snapshot.docs.map((documento) => ({
        firebaseId: documento.id,
        ...documento.data(),
      }));

      onData(registros);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export async function limpiarPuntajesFirebase() {
  const snapshot = await getDocs(puntajesRef);

  await Promise.all(
    snapshot.docs.map((documento) =>
      deleteDoc(doc(db, "puntajes", documento.id))
    )
  );
}