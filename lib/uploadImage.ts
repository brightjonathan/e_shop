import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { storage } from "./Firebase/client";

// UPLOAD A SINGLE IMAGE — kept for any other place that still uses it
export const uploadImage = async (
  file: File,
  setProgress: (value: number) => void
) => {
  return new Promise<string>((resolve, reject) => {
    const randomID = new Date().getTime() + Math.random();

    const storageRef = ref(
      storage,
      `ProductsImages/${randomID}-${file.name}`
    );

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        setProgress(progress);
      },

      (error) => {
        reject(error);
      },

      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

// UPLOAD MULTIPLE IMAGES TO FIREBASE STORAGE, WITH COMBINED PROGRESS
export const uploadMultipleImages = async (
  files: File[],
  setProgress: (value: number) => void
): Promise<string[]> => {
  // One progress slot per file, so we can average them into a single
  // number for the shared progress bar in the form.
  const progresses = new Array(files.length).fill(0);

  const reportOverallProgress = () => {
    const total = progresses.reduce((sum, p) => sum + p, 0);
    setProgress(total / progresses.length);
  };

  const uploadOne = (file: File, index: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const randomID = new Date().getTime() + Math.random();

      const storageRef = ref(
        storage,
        `ProductsImages/${randomID}-${file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          progresses[index] =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          reportOverallProgress();
        },

        (error) => {
          reject(error);
        },

        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  // Uploads run in parallel; Promise.all preserves the original file order
  // in the returned array, so files[0] -> urls[0], etc.
  return Promise.all(files.map((file, index) => uploadOne(file, index)));
};


