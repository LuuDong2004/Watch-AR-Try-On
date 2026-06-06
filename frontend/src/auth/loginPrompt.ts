/**
 * Tiny store controlling the login overlay so any component can prompt for
 * sign-in (e.g. when an anonymous visitor taps Favourites) without threading
 * callbacks through the whole tree.
 */
import { create } from 'zustand';

interface LoginPromptState {
  open: boolean;
  /** Optional default tab when opening. */
  mode: 'login' | 'register';
  show: (mode?: 'login' | 'register') => void;
  hide: () => void;
}

export const useLoginPrompt = create<LoginPromptState>((set) => ({
  open: false,
  mode: 'login',
  show: (mode = 'login') => set({ open: true, mode }),
  hide: () => set({ open: false }),
}));
