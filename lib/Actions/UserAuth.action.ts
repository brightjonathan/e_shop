import { auth } from "../Firebase/client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";



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