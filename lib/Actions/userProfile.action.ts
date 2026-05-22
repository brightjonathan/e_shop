
import { db } from "@/lib/Firebase/client"; // server-side admin SDK
import { revalidatePath } from "next/cache";

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  role: string;
  photoURL: string;
}

/**
 * Fetch a single user profile by UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return null;
    return { uid: snap.id, ...snap.data() } as UserProfileData;
  } catch (err) {
    console.error("[getUserProfile]", err);
    return null;
  }
}

/**
 * Fetch all user profiles from Firestore.
 */
export async function getAllUserProfiles(): Promise<UserProfileData[]> {
  try {
    const snap = await db.collection("users").orderBy("displayName").get();
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfileData));
  } catch (err) {
    console.error("[getAllUserProfiles]", err);
    return [];
  }
}

/**
 * Create or update a user profile.
 */
export async function upsertUserProfile(
  data: UserProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { uid, ...rest } = data;
    if (!uid) return { success: false, error: "Missing uid" };

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          ...rest,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    revalidatePath("/userprofile");
    revalidatePath(`/edit-user/${uid}`);

    return { success: true };
  } catch (err) {
    console.error("[upsertUserProfile]", err);
    return { success: false, error: "Failed to save profile" };
  }
}

/**
 * Delete a user profile by UID.
 * Only admins should call this; guard on the calling page.
 */
export async function deleteUserProfile(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) return { success: false, error: "Missing uid" };
    await db.collection("users").doc(uid).delete();
    revalidatePath("/userprofile");
    return { success: true };
  } catch (err) {
    console.error("[deleteUserProfile]", err);
    return { success: false, error: "Failed to delete profile" };
  }
}

/**
 * Update only the photoURL field for a user.
 * Called after client-side Firebase Storage upload resolves.
 */
export async function updateUserPhoto(
  uid: string,
  photoURL: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid || !photoURL) return { success: false, error: "Invalid args" };
    await db.collection("users").doc(uid).set(
      { photoURL, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    revalidatePath("/userprofile");
    revalidatePath(`/edit-user/${uid}`);
    return { success: true };
  } catch (err) {
    console.error("[updateUserPhoto]", err);
    return { success: false, error: "Failed to update photo" };
  }
}