import { create } from 'zustand';

interface SyncState {
  status: 'LOCAL' | 'SYNCED' | 'SYNCING' | 'PENDING' | 'ERROR';
  lastSyncedAt: number | null;
  pendingCount: number;
}

interface TripState {
  isOnline: boolean;
  syncState: SyncState;
  
  setOnline: (online: boolean) => void;
  setSyncState: (state: Partial<SyncState>) => void;
}

export const useTripStore = create<TripState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncState: {
    status: 'LOCAL',
    lastSyncedAt: null,
    pendingCount: 0,
  },
  
  setOnline: (online) => set({ isOnline: online }),
  setSyncState: (newState) => set((state) => ({ 
    syncState: { ...state.syncState, ...newState } 
  })),
}));
