export async function getIdb(storeName: string): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("moviepainter-db", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("cache");
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("cache", "readwrite");
      resolve(transaction.objectStore("cache"));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setIdbItem(key: string, value: unknown): Promise<void> {
  try {
    const store = await getIdb("cache");
    return new Promise((resolve, reject) => {
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB set failed", error);
  }
}

export async function getIdbItem<T>(key: string): Promise<T | null> {
  try {
    const store = await getIdb("cache");
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB get failed", error);
    return null;
  }
}
