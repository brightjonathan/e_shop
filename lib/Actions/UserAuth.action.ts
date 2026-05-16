import { GoogleAuthProvider, signOut} from 'firebase/auth'
import { auth } from "../Firebase/client";
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";



// register user with email and password
export const registerUser = async (
  username: string,
  email: string,
  password: string
) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: username });
  return user;
};


// login user with email and password
export const loginUser = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};


// reset password
export const ResetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};


// google sign in
export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  return user;
};


// sign out
export const signOutUser = async () => {
  await signOut(auth);
};