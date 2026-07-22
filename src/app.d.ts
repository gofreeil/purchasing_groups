// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// המשתמש המאומת מ-Strapi (נקבע ב-hooks.server.js) - null כשלא מחובר
			user: Record<string, any> | null;
			// ה-JWT של המשתמש מול Strapi - להעברה כ-Bearer בבקשות מאומתות
			jwt: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
