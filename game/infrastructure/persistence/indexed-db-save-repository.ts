import { createSaveEnvelope } from "@/game/infrastructure/persistence/save-migrations";
import type { V5GameState } from "@/game/domain/models/game";

const DATABASE_NAME = "meridian-idle";
const STORE_NAME = "game-saves";
const SAVE_KEY = "primary";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.addEventListener("upgradeneeded", () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
  });
  return requestToPromise(request);
}

export class IndexedDbSaveRepository {
  isAvailable(): boolean {
    return typeof indexedDB !== "undefined";
  }
  async loadRaw(): Promise<unknown | null> {
    if (!this.isAvailable()) throw new Error("IndexedDB unavailable");
    const database = await openDatabase();
    try {
      return await requestToPromise(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(SAVE_KEY));
    } finally {
      database.close();
    }
  }
  async save(state: V5GameState, now: number): Promise<void> {
    if (!this.isAvailable()) throw new Error("IndexedDB unavailable");
    const database = await openDatabase();
    try {
      await requestToPromise(
        database
          .transaction(STORE_NAME, "readwrite")
          .objectStore(STORE_NAME)
          .put(createSaveEnvelope(state, now), SAVE_KEY),
      );
    } finally {
      database.close();
    }
  }
}
