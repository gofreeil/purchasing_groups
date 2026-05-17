import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {}
});
