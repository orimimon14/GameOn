import { create } from 'zustand';

// UI-only client state (CONVENTIONS §8): theme + discovery game filter.
// Server-owned/product state must never live here.
interface UiState {
  isDarkMode: boolean;
  selectedGame: string | null;
  toggleDarkMode: () => void;
  setSelectedGame: (game: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isDarkMode: true,
  selectedGame: null,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setSelectedGame: (selectedGame) => set({ selectedGame }),
}));
