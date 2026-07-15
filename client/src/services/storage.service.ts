import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import {
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

import { storage, db } from "@/lib/firebase";

/*
|--------------------------------------------------------------------------
| Upload Limits
|--------------------------------------------------------------------------
*/

const PROFILE_MAX_SIZE = 5 * 1024 * 1024;
const GALLERY_MAX_SIZE = 5 * 1024 * 1024;
const VERIFICATION_MAX_SIZE = 10 * 1024 * 1024;
const CHAT_MAX_SIZE = 25 * 1024 * 1024;

const PROFILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const GALLERY_TYPES = PROFILE_TYPES;

const VERIFICATION_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const CHAT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
];

/*
|--------------------------------------------------------------------------
| Validators
|--------------------------------------------------------------------------
*/

function validateFile(
  file: File,
  maxSize: number,
  allowedTypes: string[],
) {
  if (file.size > maxSize) {
    throw new Error("File exceeds allowed size.");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type.");
  }
}

/*
|--------------------------------------------------------------------------
| Upload Profile Photo
|--------------------------------------------------------------------------
*/

export async function uploadProfilePhoto(
  userId: string,
  file: File,
) {
  validateFile(file, PROFILE_MAX_SIZE, PROFILE_TYPES);

  const storageRef = ref(
    storage,
    `users/${userId}/profile/${Date.now()}-${file.name}`,
  );

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "users", userId), {
    photos: arrayUnion(url),
  });

  return url;
}

/*
|--------------------------------------------------------------------------
| Upload Gallery Photo
|--------------------------------------------------------------------------
*/

export async function uploadGalleryPhoto(
  userId: string,
  file: File,
) {
  validateFile(file, GALLERY_MAX_SIZE, GALLERY_TYPES);

  const storageRef = ref(
    storage,
    `users/${userId}/gallery/${Date.now()}-${file.name}`,
  );

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "users", userId), {
    photos: arrayUnion(url),
  });

  return url;
}

/*
|--------------------------------------------------------------------------
| Upload Verification Document
|--------------------------------------------------------------------------
*/

export async function uploadVerificationDocument(
  userId: string,
  file: File,
) {
  validateFile(
    file,
    VERIFICATION_MAX_SIZE,
    VERIFICATION_TYPES,
  );

  const storageRef = ref(
    storage,
    `users/${userId}/verification/${Date.now()}-${file.name}`,
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/*
|--------------------------------------------------------------------------
| Upload Chat Image
|--------------------------------------------------------------------------
*/

export async function uploadChatImage(
  conversationId: string,
  file: File,
) {
  validateFile(file, CHAT_MAX_SIZE, CHAT_TYPES);

  const storageRef = ref(
    storage,
    `chat/${conversationId}/${Date.now()}-${file.name}`,
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/*
|--------------------------------------------------------------------------
| Upload Chat Video
|--------------------------------------------------------------------------
*/

export async function uploadChatVideo(
  conversationId: string,
  file: File,
) {
  validateFile(file, CHAT_MAX_SIZE, CHAT_TYPES);

  const storageRef = ref(
    storage,
    `chat/${conversationId}/${Date.now()}-${file.name}`,
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/*
|--------------------------------------------------------------------------
| Delete File
|--------------------------------------------------------------------------
*/

export async function deleteFile(path: string) {
  const storageRef = ref(storage, path);

  await deleteObject(storageRef);
}

/*
|--------------------------------------------------------------------------
| Get Download URL
|--------------------------------------------------------------------------
*/

export async function getFileUrl(path: string) {
  return await getDownloadURL(ref(storage, path));
}