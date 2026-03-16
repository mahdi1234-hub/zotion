"use client";

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
}

type AiChatStore = {
  isOpen: boolean;
  messages: ChatMessage[];
  isProcessing: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  addMessage: (message: ChatMessage) => void;
  setProcessing: (val: boolean) => void;
  clearMessages: () => void;
};

export const useAiChat = create<AiChatStore>((set) => ({
  isOpen: false,
  messages: [],
  isProcessing: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  onToggle: () => set((s) => ({ isOpen: !s.isOpen })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setProcessing: (val) => set({ isProcessing: val }),
  clearMessages: () => set({ messages: [] }),
}));
