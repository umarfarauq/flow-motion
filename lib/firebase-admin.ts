// Firebase Admin SDK setup (server-only)
import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function readServiceAccount(): ServiceAccountJson {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
      : "");

  if (!raw) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64.",
    );
  }

  const parsed = JSON.parse(raw) as Partial<ServiceAccountJson>;
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("Invalid Firebase service account JSON: missing required fields.");
  }

  // Some env managers escape newlines in private_key.
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");

  return parsed as ServiceAccountJson;
}

let cachedAdminApp: App | null = null;

export function getAdminApp(): App {
  if (cachedAdminApp) return cachedAdminApp;

  if (getApps().length) {
    cachedAdminApp = getApp();
    return cachedAdminApp;
  }

  const serviceAccount = readServiceAccount();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${serviceAccount.project_id}.appspot.com`;

  cachedAdminApp = initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket,
  });
  return cachedAdminApp;
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
