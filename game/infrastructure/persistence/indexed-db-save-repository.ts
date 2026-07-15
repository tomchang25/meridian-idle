import { createSaveEnvelope, migrateSave, type SaveEnvelope } from "@/game/infrastructure/persistence/save-migrations";
import type { GameState } from "@/game/domain/models/game";

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

  async load(): Promise<SaveEnvelope | null> {
    if (!this.isAvailable()) return null;
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const raw = await requestToPromise(transaction.objectStore(STORE_NAME).get(SAVE_KEY));
      return migrateSave(raw);
    } finally {
      database.close();
    }
  }

  async save(state: GameState): Promise<void> {
    if (!this.isAvailable()) return;
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      await requestToPromise(transaction.objectStore(STORE_NAME).put(createSaveEnvelope(state), SAVE_KEY));
    } finally {
      database.close();
    }
  }
}
