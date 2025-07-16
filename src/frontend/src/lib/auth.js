import { AuthClient } from "@dfinity/auth-client";
import { writable } from "svelte/store";

// Store for authentication state
export const isAuthenticated = writable(false);
export const principal = writable(null);

let authClient = null;

export async function initAuth() {
  authClient = await AuthClient.create();
  
  if (await authClient.isAuthenticated()) {
    const identity = authClient.getIdentity();
    principal.set(identity.getPrincipal().toString());
    isAuthenticated.set(true);
  }
}

export async function login() {
  return new Promise((resolve) => {
    authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        const identity = authClient.getIdentity();
        principal.set(identity.getPrincipal().toString());
        isAuthenticated.set(true);
        resolve();
      },
    });
  });
}

export async function logout() {
  await authClient.logout();
  principal.set(null);
  isAuthenticated.set(false);
}