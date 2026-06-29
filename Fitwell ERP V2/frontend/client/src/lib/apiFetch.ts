// src/lib/api.ts
export const API_URL = import.meta.env.VITE_API_URL || "";

export async function apiFetch(url: string, options?: RequestInit) {
  return fetch(`${API_URL}${url}`, {
    credentials: "include",
    ...options,
  });
}
