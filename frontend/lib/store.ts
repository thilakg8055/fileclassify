

"use client";

import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: string | null;
  name: string | null;
  userId: string | null;
  initialized: boolean;

  loadAuth: () => void;
  setAuth: (token: string, role: string, name: string, id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  name: null,
  userId: null,
  initialized: false,

  loadAuth: () => {
    if (typeof window === "undefined") return;
    set({
      token:  localStorage.getItem("token"),
      role:   localStorage.getItem("role"),
      name:   localStorage.getItem("name"),
      userId: localStorage.getItem("userId"),
      initialized: true,
    });
  },

  setAuth: (token, role, name, id) => {
    localStorage.setItem("token",  token);
    localStorage.setItem("role",   role);
    localStorage.setItem("name",   name);
    localStorage.setItem("userId", id);
    set({ token, role, name, userId: id, initialized: true });
  },

  logout: () => {
    ["token", "role", "name", "userId"].forEach((k) =>
      localStorage.removeItem(k)
    );
    set({ token: null, role: null, name: null, userId: null, initialized: true });
  },
}));