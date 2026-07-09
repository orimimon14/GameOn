import { create } from 'zustand';

import type { ActiveCall } from './callService';

// Live calls survive route changes: the call (and its overlay) belong to the
// app shell, not to the chat screen (CallManager renders them app-wide).
interface CallState {
  activeCall: ActiveCall | null;
  partnerName: string;
  setActiveCall: (call: ActiveCall | null, partnerName?: string) => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  partnerName: '',
  setActiveCall: (call, partnerName = '') => set({ activeCall: call, partnerName }),
}));
