/**
 * IndexedDB helper for storing local audio and image files.
 * This bypasses localStorage's 5MB quota and safely stores multi-megabyte MP3 and image files.
 */

const DB_NAME = 'mario_pederneiras_media_db';
const DB_VERSION = 1;
const STORE_AUDIO = 'audioFiles';
const STORE_IMAGES = 'imageFiles';

interface StoredFileRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an audio file (MP3, WAV, etc.) to IndexedDB
 */
export async function saveAudioFile(poemId: string, file: Blob | File, name?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    const record: StoredFileRecord = {
      id: poemId,
      blob: file,
      name: name || (file instanceof File ? file.name : 'audio.mp3'),
      type: file.type || 'audio/mpeg',
      updatedAt: Date.now()
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve an audio file from IndexedDB
 */
export async function getAudioFile(poemId: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const store = tx.objectStore(STORE_AUDIO);
      const req = store.get(poemId);
      req.onsuccess = () => {
        const record = req.result as StoredFileRecord | undefined;
        if (record && record.blob) {
          resolve({ blob: record.blob, name: record.name });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete an audio file from IndexedDB
 */
export async function deleteAudioFile(poemId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(STORE_AUDIO);
      const req = store.delete(poemId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Save an image file (PNG, JPG, Canva export) to IndexedDB
 */
export async function saveImageFile(poemId: string, file: Blob | File, name?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const record: StoredFileRecord = {
      id: poemId,
      blob: file,
      name: name || (file instanceof File ? file.name : 'capa.jpg'),
      type: file.type || 'image/jpeg',
      updatedAt: Date.now()
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve an image file from IndexedDB
 */
export async function getImageFile(poemId: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.get(poemId);
      req.onsuccess = () => {
        const record = req.result as StoredFileRecord | undefined;
        if (record && record.blob) {
          resolve({ blob: record.blob, name: record.name });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete an image file from IndexedDB
 */
export async function deleteImageFile(poemId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.delete(poemId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Save class photo blob in IndexedDB
 */
export async function saveClassPhoto(file: Blob | File): Promise<void> {
  return saveImageFile('class_photo_turma301', file, 'foto-turma-301.jpg');
}

/**
 * Retrieve class photo blob from IndexedDB
 */
export async function getClassPhoto(): Promise<{ blob: Blob; name: string } | null> {
  return getImageFile('class_photo_turma301');
}
