export const DB_NAME = 'MotoStockDB_V2';
export const DB_VERSION = 8; // Bumped to 8 for Loans

export const db = {
  open: () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('customers')) db.createObjectStore('customers', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('requests')) db.createObjectStore('requests', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('costs')) db.createObjectStore('costs', { keyPath: 'id' });
        
        // Legacy Air Machines Stores (Keep for data safety, but we might not use them)
        if (!db.objectStoreNames.contains('air_machines')) db.createObjectStore('air_machines', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('air_machine_sales')) db.createObjectStore('air_machine_sales', { keyPath: 'id' });

        // NEW: Air Services Store
        if (!db.objectStoreNames.contains('air_services')) db.createObjectStore('air_services', { keyPath: 'id' });

        // NEW: Layaways Store
        if (!db.objectStoreNames.contains('layaways')) db.createObjectStore('layaways', { keyPath: 'id' });

        // NEW: Loans Store
        if (!db.objectStoreNames.contains('loans')) db.createObjectStore('loans', { keyPath: 'id' });
      };
      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event) => reject(event);
    });
  },
  getAll: async (storeName: string) => {
    const dbInstance = await db.open();
    return new Promise<any[]>((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  put: async (storeName: string, item: any) => {
    const dbInstance = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (storeName: string, id: string) => {
    const dbInstance = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  bulkPut: async (storeName: string, items: any[]) => {
     if(items.length === 0) return;
     const dbInstance = await db.open();
     return new Promise((resolve, reject) => {
         const transaction = dbInstance.transaction(storeName, 'readwrite');
         const store = transaction.objectStore(storeName);
         items.forEach(item => store.put(item));
         transaction.oncomplete = () => resolve(true);
         transaction.onerror = () => reject(transaction.error);
     });
  },
  clear: async (storeName: string) => {
    const dbInstance = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  // Advanced: Execute Atomic Transaction
  transaction: async (storeNames: string[], mode: IDBTransactionMode, callback: (stores: {[key: string]: IDBObjectStore}) => void) => {
      const dbInstance = await db.open();
      return new Promise((resolve, reject) => {
          const tx = dbInstance.transaction(storeNames, mode);
          const stores: {[key: string]: IDBObjectStore} = {};
          storeNames.forEach(name => {
              stores[name] = tx.objectStore(name);
          });
          
          try {
            callback(stores);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
          } catch (e) {
            tx.abort();
            reject(e);
          }
      });
  }
};
