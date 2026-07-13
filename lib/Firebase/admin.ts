// lib/Firebase/admin.ts
// SERVER-ONLY. Never import this from a "use client" file.

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let dbInstance: Firestore | null = null;

// Initialization is LAZY — it only runs the first time getAdminDb() is
// called from inside a route handler's try/catch, so a bad key shows up
// as a clean JSON 500 response instead of crashing the whole module on
// import (which Next.js turns into a raw HTML error page).
function initAdmin(): App {
  if (app) return app;

  // Preferred: a single base64-encoded line — no \n escaping to get wrong,
  // works the same on Windows and Mac/Linux. Generate it with:
  //   node -e "const fs=require('fs');const key=JSON.parse(fs.readFileSync('serviceAccountKey.json','utf8')).private_key;console.log(Buffer.from(key).toString('base64'))"
  const b64Key = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;

  // Fallback: the old \n-escaped single-line format, if you're using that instead.
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const privateKey = b64Key ? Buffer.from(b64Key, "base64").toString("utf8") : rawKey;

  if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin is not configured — missing FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL, or FIREBASE_ADMIN_PRIVATE_KEY_B64 (or FIREBASE_ADMIN_PRIVATE_KEY) in .env.local"
    );
  }

  app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        }),
      });

  return app;
}

/** Call this inside a route handler's try/catch — never at module top-level. */
export function getAdminDb(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(initAdmin());
  return dbInstance;
}




