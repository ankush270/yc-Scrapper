import { openDB } from 'idb';
import { getAuthHeader } from './firebase';

const DB_NAME = 'yc_explorer_db';
const DB_VERSION = 1;

/**
 * Initialize the IndexedDB database with all required stores.
 */
export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Favorites store
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'companyId' });
      }

      // Collections store
      if (!db.objectStoreNames.contains('collections')) {
        const store = db.createObjectStore('collections', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
      }

      // Sandbox projects store
      if (!db.objectStoreNames.contains('sandboxProjects')) {
        const store = db.createObjectStore('sandboxProjects', { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
      }

      // AI analysis cache
      if (!db.objectStoreNames.contains('aiAnalysis')) {
        db.createObjectStore('aiAnalysis', { keyPath: 'companyId' });
      }

      // User settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Achievements
      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'id' });
      }

      // Usage stats (for gamification)
      if (!db.objectStoreNames.contains('usageStats')) {
        db.createObjectStore('usageStats', { keyPath: 'key' });
      }
    }
  });
}

// ==========================================
// API HELPER
// ==========================================

async function apiCall(endpoint, method = 'GET', body = null) {
  const token = getAuthHeader();
  if (!token) return null; // No user logged in, use local-only

  const headers = {
    'Authorization': token
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) {
      console.warn(`API call to ${endpoint} returned status ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call to ${endpoint} failed (offline/no server):`, err);
    return null;
  }
}

// ==========================================
// FAVORITES
// ==========================================

export async function addFavorite(companyId, companyData) {
  // 1. Save to local IndexedDB
  const db = await getDB();
  const favObj = {
    companyId,
    addedAt: Date.now(),
    name: companyData.name,
    industry: companyData.industry,
    batch: companyData.batch
  };
  await db.put('favorites', favObj);

  // 2. Sync to Backend if logged in
  await apiCall('/api/favorites', 'POST', {
    companyId,
    name: companyData.name,
    industry: companyData.industry,
    batch: companyData.batch
  });
}

export async function removeFavorite(companyId) {
  // 1. Delete in local IndexedDB
  const db = await getDB();
  await db.delete('favorites', companyId);

  // 2. Sync to Backend
  await apiCall(`/api/favorites/${companyId}`, 'DELETE');
}

export async function getAllFavorites() {
  const db = await getDB();
  
  // Try to sync with backend
  const backendFavs = await apiCall('/api/favorites', 'GET');
  if (backendFavs && Array.isArray(backendFavs)) {
    // Refresh IndexedDB cache with backend data
    const tx = db.transaction('favorites', 'readwrite');
    await tx.store.clear();
    for (const fav of backendFavs) {
      await tx.store.put(fav);
    }
    await tx.done;
    return backendFavs;
  }

  // Fallback to local cache
  return db.getAll('favorites');
}

export async function isFavorite(companyId) {
  const db = await getDB();
  const item = await db.get('favorites', companyId);
  return !!item;
}

// ==========================================
// COLLECTIONS
// ==========================================

export async function createCollection(name, description = '') {
  const db = await getDB();
  
  // Save locally first
  const localId = await db.add('collections', {
    name,
    description,
    companyIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // Sync to Backend
  const result = await apiCall('/api/collections', 'POST', {
    name,
    description,
    companyIds: []
  });

  if (result && result.id) {
    // Update local record to use backend ID to maintain sync alignment
    const col = await db.get('collections', localId);
    if (col) {
      await db.delete('collections', localId);
      col.id = result.id;
      await db.put('collections', col);
      return result.id;
    }
  }

  return localId;
}

export async function getAllCollections() {
  const db = await getDB();
  
  const backendCols = await apiCall('/api/collections', 'GET');
  if (backendCols && Array.isArray(backendCols)) {
    const tx = db.transaction('collections', 'readwrite');
    await tx.store.clear();
    for (const col of backendCols) {
      await tx.store.put(col);
    }
    await tx.done;
    return backendCols;
  }

  return db.getAll('collections');
}

export async function getCollection(id) {
  const db = await getDB();
  // Fetch specific collection or get from local
  const numId = Number(id);
  const local = await db.get('collections', numId);
  return local;
}

export async function addToCollection(collectionId, companyId) {
  const db = await getDB();
  const numId = Number(collectionId);
  const collection = await db.get('collections', numId);
  if (!collection) return;
  
  if (!collection.companyIds.includes(companyId)) {
    collection.companyIds.push(companyId);
    collection.updatedAt = Date.now();
    await db.put('collections', collection);

    // Sync to backend
    await apiCall(`/api/collections/${numId}`, 'PUT', {
      name: collection.name,
      description: collection.description,
      companyIds: collection.companyIds
    });
  }
}

export async function removeFromCollection(collectionId, companyId) {
  const db = await getDB();
  const numId = Number(collectionId);
  const collection = await db.get('collections', numId);
  if (!collection) return;
  
  collection.companyIds = collection.companyIds.filter(id => id !== companyId);
  collection.updatedAt = Date.now();
  await db.put('collections', collection);

  // Sync to backend
  await apiCall(`/api/collections/${numId}`, 'PUT', {
    name: collection.name,
    description: collection.description,
    companyIds: collection.companyIds
  });
}

export async function deleteCollection(id) {
  const db = await getDB();
  const numId = Number(id);
  await db.delete('collections', numId);

  // Sync to backend
  await apiCall(`/api/collections/${numId}`, 'DELETE');
}

export async function renameCollection(id, newName) {
  const db = await getDB();
  const numId = Number(id);
  const collection = await db.get('collections', numId);
  if (!collection) return;
  
  collection.name = newName;
  collection.updatedAt = Date.now();
  await db.put('collections', collection);

  // Sync to backend
  await apiCall(`/api/collections/${numId}`, 'PUT', {
    name: collection.name,
    description: collection.description,
    companyIds: collection.companyIds
  });
}

// ==========================================
// SANDBOX PROJECTS
// ==========================================

export async function createSandboxProject(project) {
  const db = await getDB();
  const projObj = {
    name: project.name || 'Untitled Idea',
    oneLiner: project.oneLiner || '',
    targetAudience: project.targetAudience || '',
    revenueModel: project.revenueModel || '',
    features: project.features || [],
    referenceCompanyIds: project.referenceCompanyIds || [],
    notes: project.notes || '',
    status: project.status || 'idea',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const localId = await db.add('sandboxProjects', projObj);

  // Sync to backend
  const result = await apiCall('/api/sandbox', 'POST', projObj);
  if (result && result.id) {
    // Match backend primary key ID
    const saved = await db.get('sandboxProjects', localId);
    if (saved) {
      await db.delete('sandboxProjects', localId);
      saved.id = result.id;
      await db.put('sandboxProjects', saved);
      return result.id;
    }
  }

  return localId;
}

export async function getAllSandboxProjects() {
  const db = await getDB();
  
  const backendProjs = await apiCall('/api/sandbox', 'GET');
  if (backendProjs && Array.isArray(backendProjs)) {
    const tx = db.transaction('sandboxProjects', 'readwrite');
    await tx.store.clear();
    for (const proj of backendProjs) {
      await tx.store.put(proj);
    }
    await tx.done;
    return backendProjs;
  }

  return db.getAll('sandboxProjects');
}

export async function getSandboxProject(id) {
  const db = await getDB();
  const numId = Number(id);
  return db.get('sandboxProjects', numId);
}

export async function updateSandboxProject(id, updates) {
  const db = await getDB();
  const numId = Number(id);
  const project = await db.get('sandboxProjects', numId);
  if (!project) return;
  
  Object.assign(project, updates, { updatedAt: Date.now() });
  await db.put('sandboxProjects', project);

  // Sync to backend
  await apiCall(`/api/sandbox/${numId}`, 'PUT', {
    name: project.name,
    oneLiner: project.oneLiner,
    targetAudience: project.targetAudience,
    revenueModel: project.revenueModel,
    features: project.features,
    referenceCompanyIds: project.referenceCompanyIds,
    notes: project.notes,
    status: project.status
  });
}

export async function deleteSandboxProject(id) {
  const db = await getDB();
  const numId = Number(id);
  await db.delete('sandboxProjects', numId);

  // Sync to backend
  await apiCall(`/api/sandbox/${numId}`, 'DELETE');
}

// ==========================================
// SETTINGS
// ==========================================

export async function getSetting(key) {
  const db = await getDB();
  const item = await db.get('settings', key);
  return item ? item.value : null;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });

  // If this setting is unlocking a badge, sync achievement to backend
  if (key.startsWith('badge_unlocked_') && value) {
    const targetBadgeId = key.replace('badge_unlocked_', '');
    await apiCall('/api/achievements/unlock', 'POST', {
      achievementId: targetBadgeId
    });
    
    // Also sync local achievements table cache
    const achTx = db.transaction('achievements', 'readwrite');
    await achTx.store.put({
      id: targetBadgeId,
      unlockedAt: value
    });
    await achTx.done;
  }
}

// ==========================================
// USAGE STATS (for gamification)
// ==========================================

export async function incrementStat(key, amount = 1) {
  const db = await getDB();
  const item = await db.get('usageStats', key);
  const current = item ? item.value : 0;
  const newValue = current + amount;
  await db.put('usageStats', { key, value: newValue });

  // Sync stat to backend
  await apiCall('/api/stats/increment', 'POST', {
    key,
    amount
  });

  return newValue;
}

export async function getStat(key) {
  const db = await getDB();
  const item = await db.get('usageStats', key);
  return item ? item.value : 0;
}

// ==========================================
// MIGRATION: localStorage → IndexedDB
// ==========================================

export async function migrateFromLocalStorage() {
  const alreadyMigrated = await getSetting('migrated_from_localStorage');
  if (alreadyMigrated) return false;

  let migratedCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('yc_note_')) {
      migratedCount++;
    }
  }

  await setSetting('migrated_from_localStorage', true);
  await setSetting('migration_date', Date.now());
  
  return migratedCount > 0;
}

// ==========================================
// BACKUP / EXPORT / IMPORT / CLEAR ALL
// ==========================================

export async function exportWorkspaceData() {
  const db = await getDB();
  const favorites = await db.getAll('favorites');
  const collections = await db.getAll('collections');
  const sandboxProjects = await db.getAll('sandboxProjects');
  
  return {
    version: 1,
    exportedAt: Date.now(),
    favorites,
    collections,
    sandboxProjects
  };
}

export async function importWorkspaceData(backup) {
  if (backup.version !== 1) {
    throw new Error('Invalid backup file version.');
  }

  const db = await getDB();

  // Restore favorites
  if (backup.favorites) {
    const tx = db.transaction('favorites', 'readwrite');
    await tx.store.clear();
    for (const fav of backup.favorites) {
      await tx.store.put(fav);
      await apiCall('/api/favorites', 'POST', fav);
    }
    await tx.done;
  }

  // Restore collections
  if (backup.collections) {
    const tx = db.transaction('collections', 'readwrite');
    await tx.store.clear();
    for (const col of backup.collections) {
      await tx.store.put(col);
      await apiCall('/api/collections', 'POST', col);
    }
    await tx.done;
  }

  // Restore sandbox projects
  if (backup.sandboxProjects) {
    const tx = db.transaction('sandboxProjects', 'readwrite');
    await tx.store.clear();
    for (const proj of backup.sandboxProjects) {
      await tx.store.put(proj);
      await apiCall('/api/sandbox', 'POST', proj);
    }
    await tx.done;
  }
}

export async function clearWorkspaceData() {
  const db = await getDB();
  
  const txFav = db.transaction('favorites', 'readwrite');
  await txFav.store.clear();
  await txFav.done;

  const txCol = db.transaction('collections', 'readwrite');
  await txCol.store.clear();
  await txCol.done;

  const txProj = db.transaction('sandboxProjects', 'readwrite');
  await txProj.store.clear();
  await txProj.done;

  // Sync clear calls to backend if endpoints were to support bulk wipes (optional)
}
