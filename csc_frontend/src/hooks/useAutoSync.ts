import { useEffect, useRef, createElement } from 'react';
import { syncCurrentDraft } from '../api/caseSync';
import type { CaseData, SyncStatus } from '../context/CaseContext';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AutoSyncOptions {
  caseData: CaseData;
  localId: string;
  syncStatus: SyncStatus;
  serverCaseId: number | null;
  isSyncReady: boolean; // New: wait for metadata hydration
  updateSyncMetadata: (updates: any) => Promise<void>;
  resetCase: () => void;
}

/**
 * Hook that automatically syncs pending drafts when connectivity is restored
 */
export function useAutoSync(options: AutoSyncOptions) {
  const {
    caseData,
    localId,
    syncStatus,
    serverCaseId,
    isSyncReady,
    updateSyncMetadata,
    resetCase,
  } = options;

  const isSyncingRef = useRef(false);
  const hasAttemptedSyncRef = useRef(false);

  useEffect(() => {
    // Reset attempt flag when localId changes (new draft)
    hasAttemptedSyncRef.current = false;
  }, [localId]);

  useEffect(() => {
    console.log('[AutoSync] Effect triggered. State:', {
      syncStatus,
      localId,
      isOnline: navigator.onLine,
      isSyncing: isSyncingRef.current,
      hasAttempted: hasAttemptedSyncRef.current,
      isSyncReady, // New check
    });
    
    // Don't sync if:
    // - Sync metadata not ready yet (hydration in progress)
    // - Already syncing
    // - Not in pending state
    // - No server connection
    if (
      !isSyncReady ||
      isSyncingRef.current ||
      syncStatus !== 'pending' ||
      !navigator.onLine
    ) {
      console.log('[AutoSync] Skipping sync. Reason:', {
        syncNotReady: !isSyncReady,
        alreadySyncing: isSyncingRef.current,
        notPending: syncStatus !== 'pending',
        offline: !navigator.onLine,
      });
      return;
    }

    // Auto-sync on mount if pending and online
    if (!hasAttemptedSyncRef.current) {
      console.log('[AutoSync] Auto-sync on mount (first attempt)');
      hasAttemptedSyncRef.current = true;
      performSync();
    }

    // Listen for online event
    const handleOnline = () => {
      console.log('[AutoSync] Online event fired!');
      if (syncStatus === 'pending' && !isSyncingRef.current && isSyncReady) {
        console.log('[AutoSync] Triggering sync after online event');
        performSync();
      } else {
        console.log('[AutoSync] Skipping sync after online event:', {
          syncStatus,
          isSyncing: isSyncingRef.current,
          isSyncReady,
        });
      }
    };

    console.log('[AutoSync] Adding online event listener');
    window.addEventListener('online', handleOnline);

    return () => {
      console.log('[AutoSync] Removing online event listener');
      window.removeEventListener('online', handleOnline);
    };
  }, [syncStatus, localId, isSyncReady]); // Added isSyncReady to deps // Removed caseData from deps to avoid re-running on every form change

  async function performSync() {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;

    try {
      console.log('[AutoSync] Attempting to sync pending draft:', localId);

      const result = await syncCurrentDraft(
        caseData,
        localId,
        updateSyncMetadata
      );

      if (result.status === 'synced' || result.status === 'already_synced') {
        console.log('[AutoSync] Sync successful:', result);
        
        toast.success('Case synced successfully! ✓', {
          duration: 4000,
          icon: createElement(CheckCircle2, { className: "text-green-600", size: 20 }),
        });

        // Reset case after successful sync (with delay to allow metadata to save)
        setTimeout(() => {
          resetCase();
        }, 1000);
      } else if (result.status === 'conflict') {
        console.warn('[AutoSync] Sync conflict:', result);
        
        toast.error('Sync conflict: Case was modified on server. Please review.', {
          duration: 6000,
          icon: createElement(AlertCircle, { className: "text-red-600", size: 20 }),
        });
      } else {
        console.error('[AutoSync] Sync failed:', result);
        
        toast.error('Sync failed. Will retry when online.', {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('[AutoSync] Sync error:', error);
      
      // Don't show error toast for network errors - it will retry on next online event
      if (navigator.onLine) {
        toast.error('Sync failed. Will retry automatically.', {
          duration: 4000,
        });
      }
    } finally {
      isSyncingRef.current = false;
    }
  }
}
