import { beforeEach, describe, expect, it } from 'vitest';

import { useUiStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ isDarkMode: true, selectedGame: null });
  });

  it('defaults to dark mode with no game filter', () => {
    expect(useUiStore.getState().isDarkMode).toBe(true);
    expect(useUiStore.getState().selectedGame).toBeNull();
  });

  it('toggles dark mode', () => {
    useUiStore.getState().toggleDarkMode();
    expect(useUiStore.getState().isDarkMode).toBe(false);
    useUiStore.getState().toggleDarkMode();
    expect(useUiStore.getState().isDarkMode).toBe(true);
  });

  it('sets and clears the selected game', () => {
    useUiStore.getState().setSelectedGame('Warzone');
    expect(useUiStore.getState().selectedGame).toBe('Warzone');
    useUiStore.getState().setSelectedGame(null);
    expect(useUiStore.getState().selectedGame).toBeNull();
  });
});
