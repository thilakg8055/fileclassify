// // "use client";
// // import { create } from "zustand";

// // interface AuthState {
// //   token: string | null;
// //   role: string | null;
// //   name: string | null;
// //   userId: string | null;
// //   setAuth: (token: string, role: string, name: string, id: string) => void;
// //   logout: () => void;
// // }

// // export const useAuthStore = create<AuthState>((set) => ({
// //   token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
// //   role: typeof window !== "undefined" ? localStorage.getItem("role") : null,
// //   name: typeof window !== "undefined" ? localStorage.getItem("name") : null,
// //   userId: typeof window !== "undefined" ? localStorage.getItem("userId") : null,
// //   setAuth: (token, role, name, id) => {
// //     localStorage.setItem("token", token);
// //     localStorage.setItem("role", role);
// //     localStorage.setItem("name", name);
// //     localStorage.setItem("userId", id);
// //     set({ token, role, name, userId: id });
// //   },
// //   logout: () => {
// //     localStorage.removeItem("token");
// //     localStorage.removeItem("role");
// //     localStorage.removeItem("name");
// //     localStorage.removeItem("userId");
// //     set({ token: null, role: null, name: null, userId: null });
// //   },
// // }));


// // "use client";

// // import { create } from "zustand";

// // interface AuthState {
// //   token: string | null;
// //   role: string | null;
// //   name: string | null;
// //   userId: string | null;
// //   initialized: boolean;

// //   loadAuth: () => void;

// //   setAuth: (
// //     token: string,
// //     role: string,
// //     name: string,
// //     id: string
// //   ) => void;

// //   logout: () => void;
// // }

// // export const useAuthStore = create<AuthState>((set) => ({

// //   token: null,
// //   role: null,
// //   name: null,
// //   userId: null,
// //   initialized: false,

// //   loadAuth: () => {

// //     if (typeof window === "undefined") return;

// //     set({
// //       token: localStorage.getItem("token"),
// //       role: localStorage.getItem("role"),
// //       name: localStorage.getItem("name"),
// //       userId: localStorage.getItem("userId"),
// //       initialized: true
// //     });

// //   },

// //   setAuth: (token, role, name, id) => {

// //     localStorage.setItem("token", token);
// //     localStorage.setItem("role", role);
// //     localStorage.setItem("name", name);
// //     localStorage.setItem("userId", id);

// //     set({
// //       token,
// //       role,
// //       name,
// //       userId: id
// //     });

// //   },

// //   logout: () => {

// //     localStorage.clear();

// //     set({
// //       token: null,
// //       role: null,
// //       name: null,
// //       userId: null
// //     });

// //   }

// // }));


// // "use client";

// // import { create } from "zustand";

// // interface AuthState {
// //   token: string | null;
// //   role: string | null;
// //   name: string | null;
// //   userId: string | null;
// //   initialized: boolean;

// //   loadAuth: () => void;

// //   setAuth: (
// //     token: string,
// //     role: string,
// //     name: string,
// //     id: string
// //   ) => void;

// //   logout: () => void;
// // }

// // export const useAuthStore = create<AuthState>((set) => ({
// //   token: null,
// //   role: null,
// //   name: null,
// //   userId: null,
// //   initialized: false,

// //   loadAuth: () => {
// //     if (typeof window === "undefined") return;

// //     set({
// //       token: localStorage.getItem("token"),
// //       role: localStorage.getItem("role"),
// //       name: localStorage.getItem("name"),
// //       userId: localStorage.getItem("userId"),
// //       initialized: true
// //     });
// //   },

// //   setAuth: (token, role, name, id) => {
// //     localStorage.setItem("token", token);
// //     localStorage.setItem("role", role);
// //     localStorage.setItem("name", name);
// //     localStorage.setItem("userId", id);

// //     set({
// //       token,
// //       role,
// //       name,
// //       userId: id,
// //       initialized: true
// //     });
// //   },

// //   logout: () => {
// //     localStorage.removeItem("token");
// //     localStorage.removeItem("role");
// //     localStorage.removeItem("name");
// //     localStorage.removeItem("userId");

// //     set({
// //       token: null,
// //       role: null,
// //       name: null,
// //       userId: null,
// //       initialized: true
// //     });
// //   }
// // }));

// // "use client";

// // import { create } from "zustand";

// // interface AuthState {
// //   token: string | null;
// //   role: string | null;
// //   name: string | null;
// //   userId: string | null;
// //   initialized: boolean;

// //   loadAuth: () => void;

// //   setAuth: (
// //     token: string,
// //     role: string,
// //     name: string,
// //     id: string
// //   ) => void;

// //   logout: () => void;
// // }

// // export const useAuthStore = create<AuthState>((set) => ({
// //   token: null,
// //   role: null,
// //   name: null,
// //   userId: null,
// //   initialized: false,

// //   loadAuth: () => {
// //     if (typeof window === "undefined") return;

// //     const token = localStorage.getItem("fc_token");
// //     const role = localStorage.getItem("fc_role");
// //     const name = localStorage.getItem("fc_name");
// //     const userId = localStorage.getItem("fc_userId");

// //     set({
// //       token: token || null,
// //       role: role || null,
// //       name: name || null,
// //       userId: userId || null,
// //       initialized: true,
// //     });
// //   },

// //   setAuth: (token, role, name, id) => {
// //     // Use a distinct key prefix "fc_" to avoid conflicts
// //     localStorage.setItem("fc_token", token);
// //     localStorage.setItem("fc_role", role);
// //     localStorage.setItem("fc_name", name);
// //     localStorage.setItem("fc_userId", id);

// //     // Also keep old keys for backward compat with api.ts getToken()
// //     localStorage.setItem("token", token);
// //     localStorage.setItem("role", role);
// //     localStorage.setItem("name", name);
// //     localStorage.setItem("userId", id);

// //     set({
// //       token,
// //       role,
// //       name,
// //       userId: id,
// //       initialized: true,
// //     });
// //   },

// //   logout: () => {
// //     // Clear both key sets
// //     ["fc_token", "fc_role", "fc_name", "fc_userId",
// //      "token", "role", "name", "userId"].forEach((k) =>
// //       localStorage.removeItem(k)
// //     );

// //     set({
// //       token: null,
// //       role: null,
// //       name: null,
// //       userId: null,
// //       initialized: true,
// //     });
// //   },
// // }));

// "use client";

// import { create } from "zustand";

// interface AuthState {
//   token: string | null;
//   role: string | null;
//   name: string | null;
//   userId: string | null;
//   initialized: boolean;

//   loadAuth: () => void;

//   setAuth: (
//     token: string,
//     role: string,
//     name: string,
//     id: string
//   ) => void;

//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   token: null,
//   role: null,
//   name: null,
//   userId: null,
//   initialized: false,

//   loadAuth: () => {
//     if (typeof window === "undefined") return;

//     // Read from the same keys api.ts uses via getToken()
//     const token = localStorage.getItem("token");
//     const role = localStorage.getItem("role");
//     const name = localStorage.getItem("name");
//     const userId = localStorage.getItem("userId");

//     set({
//       token: token || null,
//       role: role || null,
//       name: name || null,
//       userId: userId || null,
//       initialized: true,
//     });
//   },

//   setAuth: (token, role, name, id) => {
//     localStorage.setItem("token", token);
//     localStorage.setItem("role", role);
//     localStorage.setItem("name", name);
//     localStorage.setItem("userId", id);

//     set({
//       token,
//       role,
//       name,
//       userId: id,
//       initialized: true,
//     });
//   },

//   logout: () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("role");
//     localStorage.removeItem("name");
//     localStorage.removeItem("userId");

//     set({
//       token: null,
//       role: null,
//       name: null,
//       userId: null,
//       initialized: true,
//     });
//   },
// }));

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