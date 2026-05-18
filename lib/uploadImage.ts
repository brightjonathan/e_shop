import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { storage } from "./Firebase/client";


// UPLOAD IMAGE TO FIREBASE STORAGE
export const uploadImage = async (
  file: File,
  setProgress: (value: number) => void
) => {
  return new Promise<string>((resolve, reject) => {
    const randomID =
      new Date().getTime() + Math.random();

    const storageRef = ref(
      storage,
      `ProductsImages/${randomID}-${file.name}`
    );

    const uploadTask =
      uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred /
            snapshot.totalBytes) *
          100;

        setProgress(progress);
      },

      (error) => {
        reject(error);
      },

      async () => {
        const url = await getDownloadURL(
          uploadTask.snapshot.ref
        );

        resolve(url);
      }
    );
  });
};