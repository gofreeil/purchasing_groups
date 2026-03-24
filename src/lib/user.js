import { writable } from 'svelte/store';

// A simple store to manage user login status
// In a real application, this would be linked to a real authentication service
export const isLoggedIn = writable(false);
