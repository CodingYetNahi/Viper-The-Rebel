export const STORAGE_KEYS = { bestScore:'viper_best_score', settings:'viper_settings', tutorial:'viper_tutorial_complete', migrated:'viper_storage_migrated_v1' } as const;
const LEGACY_KEYS = { bestScore:'neon_void_best_score', settings:'neon_void_settings' } as const; // Historical keys retained only for one-way compatibility.
export function migrateLocalData(storage: Pick<Storage,'getItem'|'setItem'> = localStorage) {
  if(storage.getItem(STORAGE_KEYS.migrated)==='1') return false;
  for(const key of ['bestScore','settings'] as const) if(storage.getItem(STORAGE_KEYS[key])===null){ const old=storage.getItem(LEGACY_KEYS[key]); if(old!==null) storage.setItem(STORAGE_KEYS[key],old); }
  storage.setItem(STORAGE_KEYS.migrated,'1'); return true;
}
